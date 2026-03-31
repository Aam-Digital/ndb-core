/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { Observable } from "rxjs";
import { UpdatedEntity } from "../model/entity-update";
import { EntityRegistry } from "../database-entity.decorator";
import { filter, map } from "rxjs/operators";
import { UpdateMetadata } from "../model/update-metadata";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { DatabaseDocChange } from "../../database/database";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityPermissionError } from "./entity-permission-error";
import { Logging } from "../../logging/logging.service";
import { EntityActionPermission } from "../../permissions/permission-types";
import { BoundedEntityCache } from "./bounded-entity-cache";

/**
 * Handles loading and saving of data for any higher-level feature module.
 * The EntityMapperService implicitly transforms objects from instances of Entity classes to the format to be written
 * to the database and back - ensuring they you always receive instances of {@link Entity} subclasses, that you can
 * simply treat them as normal javascript class instances without worrying about database persistance logic.
 *
 * To understand more about how to use the Entity system in your own modules, refer to the How-To Guides:
 * - [How to Load and Save Data]{@link /additional-documentation/how-to-guides/load-and-save-data.html}
 * - [How to Create a new Entity Type]{@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 */
@Injectable({ providedIn: "root" })
export class EntityMapperService {
  private dbResolver = inject(DatabaseResolverService);
  private entitySchemaService = inject(EntitySchemaService);
  private currentUser = inject(CurrentUserSubject);
  private registry = inject(EntityRegistry);
  private readonly ability = inject(EntityAbility, { optional: true });

  private cache = new BoundedEntityCache();

  constructor() {
    this.dbResolver.changesFeed.subscribe((change) => {
      if (!change?._id || !change._id.includes(":")) return;
      const prefix = Entity.extractTypeFromId(change._id) + ":";
      if (change._deleted) {
        this.cache.delete(prefix, change._id);
      } else {
        this.cache.set(prefix, change._id, change);
      }
    });
  }

  /**
   * Load an Entity from the database with the given id or the registered name of that class.
   *
   * @param entityType Class that implements Entity, which is the type of Entity the results should be transformed to
   * @param id The id of the entity to load
   * @returns A Promise resolving to an instance of entityType filled with its data.
   */
  public async load<T extends Entity>(
    entityType: EntityConstructor<T> | string,
    id: string,
  ): Promise<T> {
    const ctor = this.resolveConstructor(entityType);
    const prefix = ctor.ENTITY_TYPE + ":";
    const entityId = Entity.createPrefixedId(ctor.ENTITY_TYPE, id);
    const cached = this.cache.get(prefix, entityId);
    if (cached) {
      return this.transformToEntityFormat(cached, ctor);
    }
    const result = await this.dbResolver
      .getDatabase(ctor.DATABASE)
      .get(entityId);
    this.cache.set(prefix, entityId, result);
    return this.transformToEntityFormat(result, ctor);
  }

  /**
   * Load all entities from the database of the given type (for example a list of entities of the type User).
   * <em>Important:</em> Loading via the constructor is always preferred compared to loading via string. The latter
   * doesn't allow strict type-checking and errors can only be discovered later
   *
   * @param entityType Class that implements Entity, which is the type of Entity the results should be transformed to
   * or the registered name of that class.
   * @returns A Promise resolving to an array of instances of entityType with the data of the loaded entities.
   */
  public async loadType<T extends Entity>(
    entityType: EntityConstructor<T> | string,
  ): Promise<T[]> {
    const ctor = this.resolveConstructor(entityType);
    const prefix = ctor.ENTITY_TYPE + ":";
    if (!this.cache.isFullyLoaded(prefix)) {
      const records = await this.dbResolver
        .getDatabase(ctor.DATABASE)
        .getAll(prefix);
      this.cache.setMany(prefix, records, true);
    }
    return this.cache
      .getAll(prefix)
      .map((rec) => this.transformToEntityFormat(rec, ctor));
  }

  private transformToEntityFormat<T extends Entity>(
    record: any,
    ctor: EntityConstructor<T>,
  ): T {
    const entity = new ctor("");
    try {
      this.entitySchemaService.loadDataIntoEntity(entity, record);
    } catch (e) {
      // add _id information to error message
      e.message = `Could not transform entity "${record._id}": ${e.message}`;
      throw e;
    }
    return entity;
  }

  /**
   * subscribe to this observable to receive updates whenever the state of
   * an entity of a certain type changes.
   * The updated-parameter will return the new entity as well as a field that
   * describes the type of update (either "new", "update" or "remove").
   * <br>
   * This can be used in collaboration with the update(UpdatedEntity, Entities)-function
   * to update a list of entities
   * <br>
   *
   * <em>Important:</em> Loading via the constructor is always preferred compared to loading via string. The latter
   * doesn't allow strict type-checking and errors can only be discovered later
   * @param entityType the type of the entity or the registered name of that class.
   */
  public receiveUpdates<T extends Entity>(
    entityType: EntityConstructor<T> | string,
  ): Observable<UpdatedEntity<T>> {
    const ctor = this.resolveConstructor(entityType);
    const type = new ctor().getType();
    return this.dbResolver.changesFeed.pipe(
      filter((change) => change?._id.startsWith(type + ":")),
      map((doc: DatabaseDocChange) => {
        const entity = new ctor();
        this.entitySchemaService.loadDataIntoEntity(entity, doc);
        if (doc._deleted) {
          return { type: "remove", entity: entity };
        } else if (doc._rev.startsWith("1-")) {
          // This does not cover all the cases as docs with higher rev-number might be synchronized for the first time
          return { type: "new", entity: entity };
        } else {
          return { type: "update", entity: entity };
        }
      }),
    );
  }

  /**
   * Save an entity to the database after transforming it to its database representation.
   * @param entity The entity to be saved
   * @param forceUpdate Optional flag whether any conflicting version in the database will be quietly overwritten.
   *          if a conflict occurs without the forceUpdate flag being set, the save will fail, rejecting the returned promise.
   */
  public async save<T extends Entity>(
    entity: T,
    forceUpdate: boolean = false,
  ): Promise<any> {
    this.assertPermission(entity);
    this.setEntityMetadata(entity);
    const rawData =
      this.entitySchemaService.transformEntityToDatabaseFormat(entity);
    const result = await this.dbResolver
      .getDatabase(entity.getConstructor().DATABASE)
      .put(rawData, forceUpdate);
    if (result?.ok) {
      entity._rev = result.rev;
      rawData._rev = result.rev;
      this.cache.set(entity.getType() + ":", entity.getId(), rawData);
    }
    return result;
  }

  /**
   * Saves an array of entities that are possibly heterogeneous, i.e.
   * the entity-type of all the entities does not have to be the same.
   * This method should be chosen whenever a bigger number of entities needs to be
   * saved
   * @param entities The entities to save
   * @param forceUpdate Optional flag whether any conflicting version in the database will be quietly overwritten.
   *          if a conflict occurs without the forceUpdate flag being set, the save will fail, rejecting the returned promise.
   */
  public async saveAll(
    entities: Entity[],
    forceUpdate: boolean = false,
  ): Promise<any[]> {
    entities.forEach((e) => this.assertPermission(e));
    entities.forEach((e) => this.setEntityMetadata(e));

    const allRawData = entities.map((e) =>
      this.entitySchemaService.transformEntityToDatabaseFormat(e),
    );

    // group by DATABASE index to send batched puts per database
    const groupedByDb = new Map<string, number[]>();
    entities.forEach((e, idx) => {
      const db = e.getConstructor().DATABASE;
      if (!groupedByDb.has(db)) {
        groupedByDb.set(db, []);
      }
      groupedByDb.get(db).push(idx);
    });

    const savePromises = Array.from(groupedByDb.entries()).map(
      ([db, indices]) => {
        const rawBatch = indices.map((i) => allRawData[i]);
        return this.dbResolver
          .getDatabase(db)
          .putAll(rawBatch, forceUpdate)
          .then((results) =>
            indices.map((origIdx, i) => ({ origIdx, result: results[i] })),
          );
      },
    );

    const batchResults = (await Promise.all(savePromises)).flat();
    // sort back to original order
    batchResults.sort((a, b) => a.origIdx - b.origIdx);

    const results = batchResults.map(({ origIdx, result: res }) => {
      if (res.ok) {
        const entity = entities[origIdx];
        entity._rev = res.rev;
        allRawData[origIdx]._rev = res.rev;
        this.cache.set(
          entity.getType() + ":",
          entity.getId(),
          allRawData[origIdx],
        );
      }
      return res;
    });
    return results;
  }

  /**
   * Delete an entity from the database.
   * @param entity The entity to be deleted
   */
  public async remove<T extends Entity>(entity: T): Promise<any> {
    this.assertPermission(entity, "delete");
    this.cache.delete(entity.getType() + ":", entity.getId());
    return this.dbResolver
      .getDatabase(entity.getConstructor().DATABASE)
      .remove(entity);
  }

  protected resolveConstructor<T extends Entity>(
    constructible: EntityConstructor<T> | string,
  ): EntityConstructor<T> | undefined {
    if (typeof constructible === "string") {
      return this.registry.get(constructible) as EntityConstructor<T>;
    } else {
      return constructible;
    }
  }

  private assertPermission(entity: Entity, action?: EntityActionPermission) {
    if (!this.ability) {
      return;
    }
    if (!this.ability.initialized) {
      Logging.warn(
        `Permission check skipped for "${entity.getId()}": ability not yet initialized`,
      );
      return;
    }
    const checkedAction = action ?? (entity.isNew ? "create" : "update");
    if (this.ability.cannot(checkedAction, entity)) {
      throw new EntityPermissionError(
        checkedAction,
        entity.getId(),
        entity.getType(),
      );
    }
  }

  protected setEntityMetadata(entity: Entity) {
    const currentUserId = this.currentUser.value?.getId();
    // allow PublicForm to inject a special created.by already beforehand
    const metadataBy =
      currentUserId ?? (entity.isNew ? entity.created?.by : undefined);
    const newMetadata = new UpdateMetadata(metadataBy);
    if (entity.isNew) {
      entity.created = newMetadata;
    }
    entity.updated = newMetadata;
  }
}
