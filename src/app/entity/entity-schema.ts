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


import {Entity} from './entity';

export interface SchemaLine {
  dataType: string,
  isArray: boolean, // TODO: implement array support in EntitySchema
  isOptional: boolean,
  isIndexed: boolean, // TODO: implement index support in EntitySchema
  defaultValue: any
}

/**
 * EntitySchema provides functions to handle data conversion for types defined in the schema.
 *
 * A schema can be defined as a simple Javascript object where keys / attribute names are the names of the database fields
 * with their value being a string that defines the type and other configuration of that field.
 *
 * Example:
    {
      _id: 'string',
      name: 'string=anonymous',
      age: 'number?',
      supervisor: 'User'
    }
 * The config string follows the pattern "TYPE[]?*=DEFAULT_VALUE"
 * Only TYPE is required, the other modifiers can be left out.
 * - "[]" indicates an array of values of the given type
 * - "?" indicates the field is optional and is only included in the database record if its value is defined
 * - "*" indicates that the entities can be queried using this field, an index is created automatically
 * - "=DEFAULT_VALUE" defines a default value that is automatically assigned if the value is not already set
 */
export class EntitySchema<T extends Entity> {
  private originalSchema: Object;
  schema: Map<string, SchemaLine>;

  keys() {
    return this.schema.keys();
  }

  get(key: string): SchemaLine {
    return this.schema.get(key);
  }


  constructor(originalSchema: Object) {
    this.originalSchema = originalSchema;
    this.schema = this.parseSchema(originalSchema);
  }

  /**
   * Create a new EntitySchema instance extending this schema with the given additional properties
   * @param extensionSchema the schema object defining additional properties
   */
  public extend<S extends Entity>(extensionSchema: Object): EntitySchema<S> {
    return new EntitySchema<S>(Object.assign(extensionSchema, this.originalSchema));
  }



  private parseSchema(schema: Object) {
    const parsedSchema = new Map<string, SchemaLine>();
    for (const key of Object.keys(schema)) {
      parsedSchema.set(key, this.parseSchemaLine(schema[key]));
    }
    return parsedSchema;
  }

  private parseSchemaLine(schemaLine: string): SchemaLine {
    const parts = schemaLine.match(/(\w+)(\[\])?(\?)?(\*)?(\=)?(.*)?/).slice(1, 7);

    return {
      dataType: parts[0],
      isArray: (parts[1] !== undefined),
      isOptional: (parts[2] !== undefined),
      isIndexed: (parts[3] !== undefined),
      defaultValue: parts[4] !== undefined ? this.getDefaultValue(parts[5], parts[0]) : undefined
    };
  }



  public transformDatabaseToEntityFormat(data: any) {
    for (const key of this.schema.keys()) {
      const schemaLine = this.schema.get(key);

      if (data[key] === undefined) {
        data[key] = schemaLine.defaultValue;
      } else {
        data[key] = this.transformToEntityDataType(data[key], schemaLine);
      }

      if (schemaLine.isArray) {
        throw new Error('schema option "isArray" not implemented yet');
      }
      if (schemaLine.isIndexed) {
        throw new Error('schema option "isIndexed" not implemented yet');
      }

      if (schemaLine.isOptional && data[key] === undefined) {
        // don't explicitly write 'undefined' values, this could overwrite setup logic from the Entity classes
        delete data[key];
      }
    }

    return data;
  }


  private getDefaultValue(strValue: string, dataType: string): any {
    switch (dataType.toLowerCase()) {
      case 'string':
        if (strValue === undefined) {
          return '';
        } else {
          return strValue;
        }
      case 'number':
        if (strValue === undefined) {
          return 0;
        } else {
          return Number(strValue);
        }
      case 'month':
      case 'date':
        if (strValue === undefined) {
          return new Date();
        } else {
          return new Date(strValue);
        }
      default:
        return undefined;
    }
  }

  private transformToEntityDataType(value: any, schemaLine: SchemaLine): any {
    switch (schemaLine.dataType.toLowerCase()) {
      case 'string':
        return String(value);

      case 'number':
        return Number(value);

      case 'month':
      case 'date':
        const date =  new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('failed to convert data to Date object: ' + value);
        }
        return date;

      default:
        return value;
    }
  }






  public transformEntityToDatabaseFormat(entity: Entity) {
    const data = {};

    for (const key of this.schema.keys()) {
      const schemaLine = this.schema.get(key);

      data[key] = this.transformToDatabaseDataType(entity[key], schemaLine);
      if (data[key] === undefined) {
        data[key] = schemaLine.defaultValue;
      }
    }

    return data;
  }

  private transformToDatabaseDataType(value: any, schemaLine: SchemaLine) {
    switch (schemaLine.dataType.toLowerCase()) {
      case 'month':
        if (!(value instanceof Date)) {
          value = new Date(value);
        }
        return (value.getFullYear().toString() + '-' + (value.getMonth() + 1).toString());
      case 'date':
      case 'string':
      case 'number':
      default:
        return value;
    }
  }
}
