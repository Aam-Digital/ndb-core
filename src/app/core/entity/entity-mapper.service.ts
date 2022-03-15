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

import { Inject, Injectable, Optional } from "@angular/core";
import { Database } from "../database/database";
import { Entity, EntityConstructor } from "./model/entity";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { EMPTY, Observable, Subject } from "rxjs";
import { UpdatedEntity } from "./model/entity-update";
import { LoggingService } from "../logging/logging.service";
import { ENTITIES, EntityRegistry } from "./database-entity.decorator";

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
@Injectable()
export class EntityMapperService {
  private publishers: Map<string, Subject<any>> = new Map();
  constructor(
    private _db: Database,
    private entitySchemaService: EntitySchemaService,
    @Inject(ENTITIES) protected registry: EntityRegistry,
    @Optional() private loggingService: LoggingService
  ) {}

  /**
   * Load an Entity from the database with the given id.
   *
   * @param entityType Class that implements Entity, which is the type of Entity the results should be transformed to
   * @param id The id of the entity to load
   * @returns A Promise resolving to an instance of entityType filled with its data.
   */
  public async load<T extends Entity>(
    entityType: EntityConstructor<T> | string,
    id: string
  ): Promise<T> {
    const ctor = this.resolveConstructor(entityType);
    if (ctor === undefined) {
      throw Error("Entity by id not found");
    }
    const resultEntity = new ctor("");
    const result = await this._db.get(
      Entity.createPrefixedId(resultEntity.getType(), id)
    );
    this.entitySchemaService.loadDataIntoEntity(resultEntity, result);
    return resultEntity;
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
    entityType: EntityConstructor<T> | string
  ): Promise<T[]> {
    const resultArray: Array<T> = [];
    const ctor = this.resolveConstructor(entityType);
    if (!ctor) {
      return [];
    }

    const allRecordsOfType = await this._db.getAll(
      new ctor("").getType() + ":"
    );

    for (const record of allRecordsOfType) {
      const entity = new ctor("");
      this.entitySchemaService.loadDataIntoEntity(entity, record);
      resultArray.push(entity);
    }

    return resultArray;
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
   * The first update that one will receive - immediately after subscribing - is <code>null</code>.
   * The <code>update</code>-function takes this into account.
   * @param entityType the type of the entity or the registered name of that class.
   */
  public receiveUpdates<T extends Entity>(
    entityType: EntityConstructor<T> | string
  ): Observable<UpdatedEntity<T>> {
    const ctor = this.resolveConstructor(entityType);
    if (ctor === undefined) {
      return EMPTY;
    }
    const type = new ctor().getType();
    let publisher = this.publishers[type];
    // subject doesn't exist yet or is closed
    if (!publisher || publisher.closed) {
      publisher = new Subject<T>();
      this.publishers[type] = publisher;
    }
    return publisher.asObservable();
  }

  /**
   * Save an entity to the database after transforming it to its database representation.
   * @param entity The entity to be saved
   * @param forceUpdate Optional flag whether any conflicting version in the database will be quietly overwritten.
   *          if a conflict occurs without the forceUpdate flag being set, the save will fail, rejecting the returned promise.
   */
  public async save<T extends Entity>(
    entity: T,
    forceUpdate: boolean = false
  ): Promise<any> {
    const rawData = this.entitySchemaService.transformEntityToDatabaseFormat(
      entity
    );
    this.sendUpdate(entity, entity._rev === undefined ? "new" : "update");
    const result = await this._db.put(rawData, forceUpdate);
    if (result?.ok) {
      entity._rev = result.rev;
    }
    return result;
  }

  /**
   * Delete an entity from the database.
   * @param entity The entity to be deleted
   */
  public remove<T extends Entity>(entity: T): Promise<any> {
    this.sendUpdate(entity, "remove");
    return this._db.remove(entity);
  }

  /**
   * publishes a new entity update to all subscribing listeners
   *
   * @param entity The entity to update
   * @param type The type, see {@link UpdatedEntity#type}
   */
  private sendUpdate<T extends Entity>(
    entity: T,
    type: "new" | "update" | "remove"
  ) {
    const publisher = this.publishers[entity.getType()];
    if (publisher && !publisher.closed) {
      publisher.next({ entity: entity, type: type });
    }
  }

  protected resolveConstructor<T extends Entity>(
    constructible: EntityConstructor<T> | string
  ): EntityConstructor<T> | undefined {
    if (typeof constructible === "string") {
      const ctor = this.registry.get(constructible) as
        | EntityConstructor<T>
        | undefined;
      if (ctor === undefined) {
        this.loggingService.warn(
          `Cannot find entity corresponding to identifier ${constructible}`
        );
      }
      return ctor;
    } else {
      return constructible;
    }
  }
}
