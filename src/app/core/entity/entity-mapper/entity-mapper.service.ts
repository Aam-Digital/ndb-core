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

import { Injectable } from "@angular/core";
import { Database } from "../../database/database";
import { Entity, EntityConstructor } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { Observable } from "rxjs";
import { UpdatedEntity } from "../model/entity-update";
import { EntityRegistry } from "../database-entity.decorator";
import { map } from "rxjs/operators";
import { UpdateMetadata } from "../model/update-metadata";
import { SessionSubject } from "../../user/user";

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
  constructor(
    private _db: Database,
    private entitySchemaService: EntitySchemaService,
    private sessionInfo: SessionSubject,
    private registry: EntityRegistry,
  ) {}

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
    const entityId = Entity.createPrefixedId(ctor.ENTITY_TYPE, id);
    const result = await this._db.get(entityId);
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
    const records = await this._db.getAll(ctor.ENTITY_TYPE + ":");
    return records.map((rec) => this.transformToEntityFormat(rec, ctor));
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
    return this._db.changes(type + ":").pipe(
      map((doc) => {
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
    this.setEntityMetadata(entity);
    const rawData =
      this.entitySchemaService.transformEntityToDatabaseFormat(entity);
    const result = await this._db.put(rawData, forceUpdate);
    if (result?.ok) {
      entity._rev = result.rev;
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
    entities.forEach((e) => this.setEntityMetadata(e));
    const rawData = entities.map((e) =>
      this.entitySchemaService.transformEntityToDatabaseFormat(e),
    );
    const results = await this._db.putAll(rawData, forceUpdate);
    results.forEach((res, idx) => {
      if (res.ok) {
        const entity = entities[idx];
        entity._rev = res.rev;
      }
    });
    return results;
  }

  /**
   * Delete an entity from the database.
   * @param entity The entity to be deleted
   */
  public remove<T extends Entity>(entity: T): Promise<any> {
    return this._db.remove(entity);
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

  protected setEntityMetadata(entity: Entity) {
    // TODO use Entity (CurrentlyLoggedIn) or keep AuthUser?
    const newMetadata = new UpdateMetadata(this.sessionInfo.value?.entityId);
    if (entity.isNew) {
      entity.created = newMetadata;
    }
    entity.updated = newMetadata;
  }
}
