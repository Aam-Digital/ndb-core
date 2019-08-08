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
import {Entity, EntityConstructor} from './entity';
import {EntitySchemaService} from './schema/entity-schema.service';

/**
 * The default generic DataMapper for Entity and any subclass.
 * If necessary, write a specific Mapper for your special Entity subclass.
 */
@Injectable()
export class EntityMapperService {


  constructor(
    private _db: Database,
    private entitySchemaService: EntitySchemaService,
  ) { }

  /**
   * Loads an Entity from the database with the given id.
   *
   * @param entityType a class that implements <code>Entity</code>.
   * @param id the id of the entity to load.
   * @returns A Promise containing the resultEntity filled with its data.
   */
  public async load<T extends Entity>(entityType: EntityConstructor<T>, id: string): Promise<T> {
    const resultEntity = new entityType('');
    const result = await this._db.get(Entity.createPrefixedId(resultEntity.getType(), id));
    this.entitySchemaService.loadDataIntoEntity(resultEntity, result);
    return resultEntity;
  }

  /**
   * Loads all entities from the database of the given type (for example a list of entities of the type User).
   *
   * @param entityType a schoolClass that implements <code>Entity</code>.
   * @returns A Promise containing an array with the loaded entities.
   */
  public async loadType<T extends Entity>(entityType: EntityConstructor<T>): Promise<T[]> {
    const resultArray: Array<T> = [];

    const allRecordsOfType = await this._db.getAll(new entityType('').getType() + ':');

    for (const record of allRecordsOfType) {
      const entity = new entityType('');
      this.entitySchemaService.loadDataIntoEntity(entity, record);
      resultArray.push(entity);
    }

    return resultArray;
  }

  public async save<T extends Entity>(entity: T, forceUpdate: boolean = false): Promise<any> {
    const rawData = this.entitySchemaService.transformEntityToDatabaseFormat(entity);
    const result = await this._db.put(rawData, forceUpdate);
    if (result.ok) {
      entity._rev = result.rev;
    }
    return result;
  }

  public remove<T extends Entity>(entity: T): Promise<any> {
    return this._db.remove(entity);
  }

}
