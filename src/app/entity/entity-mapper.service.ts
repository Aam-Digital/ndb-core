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

import { Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Entity } from './entity';
import {PassableEntityConstructor} from './PassableEntityConstructor';
import {EntityRelation} from './EntityRelation';

/**
 * The default generic DataMapper for Entity and any subclass.
 * If necessary, write a specific Mapper for your special Entity subclass.
 */
@Injectable()
export class EntityMapperService {

  private static createDatabaseIdByEntity<T extends Entity>(entity: T): string {
    return EntityMapperService.createDatabaseId(entity.getType(), entity.getId());
  }

  private static createDatabaseId(type: string, id: string): string {
    return type + ':' + id;
  }

  constructor(private _db: Database) {
  }

  /**
   * Loads an Entity from the database with the given id.
   *
   * @param entityType a class that implements <code>Entity</code>.
   * @param id the id of the entity to load.
   * @returns A Promise containing the resultEntity filled with its data.
   */
  public load<T extends Entity>(entityType: PassableEntityConstructor<T>, id: string): Promise<T> {
    const resultEntity = new entityType('');
    return this._db.get(EntityMapperService.createDatabaseId(resultEntity.getType(), id)).then(
      function (result: any) {
        resultEntity.load(result);
        return resultEntity;
      },
      function (error: any) {
        throw error;
      }
    );
  }

  /**
   * Loads all entities from the database of the given type (for example a list of entities of the type User).
   *
   * @param entityType a class that implements <code>Entity</code>.
   * @returns A Promise containing an array with the loaded entities.
   */
  public loadType<T extends Entity>(entityType: PassableEntityConstructor<T>): Promise<T[]> {
    let resultEntity = new entityType('');
    return this._db.getAll(resultEntity.getType() + ':').then(
      function (result: any) {
        const resultArray: Array<T> = [];
        for (const current of result) {
          resultArray.push(resultEntity.load(current));
          resultEntity = new entityType('');
        }
        return resultArray;
      },
      function (error: any) {
        throw error;
      }
    )
  }

  /**
   * Loads all entities of type O/inputType that occur in a entity of type R/relationType and reference the same entity of type I/inputType
   * with an id equal to inputId
   *
   * @param inputType the type of entity where you have the id
   * @param outputType the type of the entities which you want to get
   * @param relationType the type of the relation that is used for resolving the call
   * @param inputId the id of the input entity
   */
  public loadTypeForRelation<I extends Entity, O extends Entity, R extends EntityRelation>(
    inputType: typeof Entity | PassableEntityConstructor<I>,
    outputType: typeof Entity | PassableEntityConstructor<O>,
    relationType: typeof EntityRelation | PassableEntityConstructor<R>,
    inputId: string,
  ): Promise<O[]> {
    const inputField: string = (relationType as typeof EntityRelation).getParameterName(inputType as typeof Entity);
    const outputField: string = (relationType as typeof EntityRelation).getParameterName(outputType as typeof Entity);
    return this.loadType<R>(relationType as PassableEntityConstructor<R>)
      .then((relations: R[]) => relations.filter((relation: R) => relation[inputField] === inputId))
      .then(async (relations: R[]) => {
        const promises: Promise<O>[] = [];
        relations.forEach(relation =>
          promises.push(this.load<O>(outputType as PassableEntityConstructor<O>, relation[outputField])));
        return await Promise.all(promises);
      })
  }

  public save<T extends Entity>(entity: T, forceUpdate: boolean = false): Promise<any> {
    entity['_id'] = EntityMapperService.createDatabaseIdByEntity(entity);
    return this._db.put(entity.rawData(), forceUpdate)
      .then(result => {
        if (result.ok) {
          entity._rev = result.rev;
        }
        return result;
      })
  }

  public remove<T extends Entity>(entity: T): Promise<any> {
    return this._db.remove(entity);
  }

}
