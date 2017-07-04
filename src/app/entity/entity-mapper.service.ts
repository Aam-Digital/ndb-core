import { Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Entity } from './entity';
import { forEach } from '@angular/router/src/utils/collection';

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
    return this._db.get(resultEntity.getId()).then(
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
        let resultArray: Array<T> = [];
        for (let current of result.rows) {
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
    // TODO: how to save 'references' of this Entity to other Entities?
    //      e.g. a 'Child' may have 'FamilyMember's who are Entity instances of their own
    //      and should be saved separately in the database
    return this._db.put(entity);
  }

  public remove<T extends Entity>(entity: T): Promise<any> {
    return this._db.remove(entity);
  }

}
