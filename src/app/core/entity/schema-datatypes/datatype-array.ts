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


import { EntitySchemaDatatype } from '../schema/entity-schema-datatype';
import { EntitySchemaField } from '../schema/entity-schema-field';
import { EntitySchemaService } from '../schema/entity-schema.service';

export const arrayEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'array',

  transformToDatabaseFormat: (value: any[], schemaField: EntitySchemaField, schemaService: EntitySchemaService) => {
    if (!Array.isArray(value)) {
      console.warn('property to be transformed with "array" EntitySchema is not an array', value);
      return value;
    }

    const arrayElementDatatype: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(schemaField.arrayDataType);
    return value.map((el) => arrayElementDatatype
      .transformToDatabaseFormat(el, generateSubSchemaField(schemaField), schemaService));
  },


  transformToObjectFormat: (value: any[], schemaField: EntitySchemaField, schemaService: EntitySchemaService) => {
    if (!Array.isArray(value)) {
      console.warn('property to be transformed with "array" EntitySchema is not an array', value);
      return value;
    }

    const arrayElementDatatype: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(schemaField.arrayDataType);

    return value.map((el) => arrayElementDatatype
      .transformToObjectFormat(el, generateSubSchemaField(schemaField), schemaService));
  },
};

function generateSubSchemaField(arraySchemaField: EntitySchemaField) {
  const subSchemaField = Object.assign({}, arraySchemaField);
  subSchemaField.dataType = arraySchemaField.arrayDataType;
  delete subSchemaField.arrayDataType;
  return subSchemaField;
}
