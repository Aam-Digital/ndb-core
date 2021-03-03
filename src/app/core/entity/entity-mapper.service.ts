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
import { Database } from "../database/database";
import { Entity, EntityConstructor } from "./entity";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { BehaviorSubject, Observable } from "rxjs";

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
  private publishers: Map<string, BehaviorSubject<any>> = new Map();
  constructor(
    private _db: Database,
    private entitySchemaService: EntitySchemaService
  ) {}

  /**
   * Load an Entity from the database with the given id.
   *
   * @param entityType Class that implements Entity, which is the type of Entity the results should be transformed to
   * @param id The id of the entity to load
   * @returns A Promise resolving to an instance of entityType filled with its data.
   */
  public async load<T extends Entity>(
    entityType: EntityConstructor<T>,
    id: string
  ): Promise<T> {
    const resultEntity = new entityType("");
    const result = await this._db.get(
      Entity.createPrefixedId(resultEntity.getType(), id)
    );
    this.entitySchemaService.loadDataIntoEntity(resultEntity, result);
    return resultEntity;
  }

  /**
   * Load all entities from the database of the given type (for example a list of entities of the type User).
   *
   * @param entityType Class that implements Entity, which is the type of Entity the results should be transformed to
   * @returns A Promise resolving to an array of instances of entityType with the data of the loaded entities.
   */
  public async loadType<T extends Entity>(
    entityType: EntityConstructor<T>
  ): Promise<T[]> {
    const resultArray: Array<T> = [];

    const allRecordsOfType = await this._db.getAll(
      new entityType("").getType() + ":"
    );

    for (const record of allRecordsOfType) {
      const entity = new entityType("");
      this.entitySchemaService.loadDataIntoEntity(entity, record);
      resultArray.push(entity);
    }

    return resultArray;
  }

  /**
   * returns a publisher (which is a {@link BehaviorSubject}) for a certain
   * entityType. If this publisher didn't exist previously or this publisher existed
   * but was unsubscribed from, this method will create a new publisher and add it
   * to the list of publishers for this entity-type
   * @param entityType The entity-type to get the publisher for
   * @private
   */

  private getPublisherFor<T extends Entity>(
    entityType: string
  ): BehaviorSubject<any> {
    let publisher = this.publishers[entityType];
    if (!publisher || publisher.closed) {
      publisher = new BehaviorSubject<T>(null);
      this.publishers[entityType] = publisher;
    }
    return publisher;
  }

  /**
   * Load all entities of a certain type and further on receive updates
   * when the state of all entities are changing.
   * These updates are either new entities that have been added or
   * entities that have been updated.
   * This can be used in conjunction with {@link updateEntities} to
   * make sure new entities are added and existing ones are updated.
   * The updates are published and can be received via the returning observable.
   * The subscription must be unsubscribed if no more entities should be received.
   *
   * ##Example:
   * Receive new notes and add them to a model to be displayed
   * in a table
   * ```ts
   * ngOnInit() {
   *   this.subscription = entityMapper
   *     .loadAll<Note>(Note)
   *     .pipe(updateEntities())
   *     .subscripe((update) => {
   *       this.notes = update(this.notes);
   *     })
   * }
   * ```
   * @param entityCtor
   */

  public loadAll<T extends Entity>(
    entityCtor: EntityConstructor<T>
  ): Observable<T> {
    const entityType = new entityCtor("").getType();
    const publisher = this.getPublisherFor<T>(entityType);
    this._db.getAll(entityType + ":").then((result) => {
      for (const record of result) {
        const entity = new entityCtor("");
        this.entitySchemaService.loadDataIntoEntity(entity, record);
        publisher.next(entity);
      }
    });
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
    const publisher = this.publishers[entity.getType()];
    if (publisher && !publisher.closed) {
      publisher.next(entity);
    }
    const rawData = this.entitySchemaService.transformEntityToDatabaseFormat(
      entity
    );
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
    return this._db.remove(entity);
  }
}
