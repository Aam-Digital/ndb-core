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


import {Entity} from '../entity';
import {EntitySchemaDatatype} from './entity-schema-datatype';
import {Injectable} from '@angular/core';
import {defaultEntitySchemaDatatype} from '../schema-datatypes/datatype-default';
import {EntitySchema} from './entity-schema';
import {EntitySchemaField} from './entity-schema-field';
import {stringEntitySchemaDatatype} from '../schema-datatypes/datatype-string';
import {numberEntitySchemaDatatype} from '../schema-datatypes/datatype-number';
import {dateEntitySchemaDatatype} from '../schema-datatypes/datatype-date';
import {monthEntitySchemaDatatype} from '../schema-datatypes/datatype-month';


/**
 * EntitySchemaService provides functions to handle data conversion for types defined in the schema.
 */
@Injectable()
export class EntitySchemaService {
  /**
   * Internal registry of data type definitions.
   * You can extend the Schema system with your data type conversions by using EntitySchema.registerSchemaDatatype()
   */
  private schemaTypes = new Map<string, EntitySchemaDatatype>();


  constructor() {
    this.registerBasicDatatypes();
  }

  private registerBasicDatatypes() {
    this.registerSchemaDatatype(stringEntitySchemaDatatype);
    this.registerSchemaDatatype(numberEntitySchemaDatatype);
    this.registerSchemaDatatype(dateEntitySchemaDatatype);
    this.registerSchemaDatatype(monthEntitySchemaDatatype);
  }


  /**
   * Add a data type definition to the registry to provide a conversion between what is written into the database
   * and what is available in Entity objects.
   * @param type The EntitySchemaDatatype object definition providing data transformation functions.
   */
  public registerSchemaDatatype(type: EntitySchemaDatatype) {
    this.schemaTypes.set(type.name, type);
  }

  public getDatatypeOrDefault(datatypeName: string) {
    datatypeName = datatypeName.toLowerCase();

    if (this.schemaTypes.has(datatypeName)) {
      return this.schemaTypes.get(datatypeName);
    } else {
      return defaultEntitySchemaDatatype;
    }
  }


  public transformDatabaseToEntityFormat(data: any, schema: EntitySchema) {
    for (const key of schema.keys()) {
      const schemaField: EntitySchemaField = schema.get(key);
      if (data[key] !== undefined) {
        data[key] = this.getDatatypeOrDefault(schemaField.dataType).transformToObjectFormat(data[key]);
      }

      if (schemaField.generateIndex) {
        throw new Error('schema option "isIndexed" not implemented yet');
      }
    }

    return data;
  }

  public loadDataIntoEntity(entity: Entity, data: any) {
    data = this.transformDatabaseToEntityFormat(data,  entity.getConstructor().schema);
    Object.assign(entity, data);
  }


  public transformEntityToDatabaseFormat(entity: Entity): any {
    const data = {};

    for (const key of entity.getConstructor().schema.keys()) {
      const schemaField: EntitySchemaField = entity.getConstructor().schema.get(key);

      if (entity[key] !== undefined) {
        data[key] = this.getDatatypeOrDefault(schemaField.dataType).transformToDatabaseFormat(entity[key]);
      }
    }

    data['searchIndices'] = entity.generateSearchIndices();

    return data;
  }
}
