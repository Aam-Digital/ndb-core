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

/**
 * The default generic DataMapper for Entity and any subclass.
 * If necessary, write a specific Mapper for your special Entity subclass.
 */
@Injectable()
export class EntityMapperService {

  constructor(private _db: Database) {
  }

  /**
   * Loads an Entity from the database into the given resultEntity instance.
   *
   * @param resultEntity An (empty) instance of an Entity class with its ID set to the one to be searched.
   *          (This is necessary because TypeScript generic types are not available at runtime.)
   * @returns A Promise containing the resultEntity filled with its data.
   */
  public load<T extends Entity>(resultEntity: T): Promise<T> {
    return this._db.get(resultEntity.getIdWithPrefix()).then(
      function (result: any) {
        Object.assign(resultEntity, result);
        return resultEntity;
      },
      function (error: any) {
        throw error;
      }
    );
  }

  /**
   * Loads a list of Entity from the database whose IDs contain the prefix of the given resultEntity class.
   *
   * @param resultEntity An (empty) instance of an Entity class. The prefix of this class will be used to load a
   *          list of Entity from the database.
   * @returns A Promise containing an array with the entities.
   */
  public loadAll<T extends Entity>(resultEntity: T): Promise<T[]> {
    return this._db.getAll(resultEntity.getPrefix()).then(
      function (result: any) {
        const resultArray: Array<T> = [];
        for (const current of result.rows) {
          resultArray.push(<T> current.doc);
        }
        return resultArray;
      },
      function (error: any) {
        throw error;
      }
    )
  }

  public save<T extends Entity>(entity: T): Promise<any> {

    const symbols: symbol[] = Object.getOwnPropertySymbols(entity);

    for (const symbol of symbols) {
      console.log("Symbol:");
      console.log(symbol);
    }

    // TODO: how to save 'references' of this Entity to other Entities?
    //      e.g. a 'Child' may have 'FamilyMember's who are Entity instances of their own
    //      and should be saved separately in the database
    return this._db.put(entity);
  }

  public remove<T extends Entity>(entity: T): Promise<any> {
    return this._db.remove(entity);
  }

}
