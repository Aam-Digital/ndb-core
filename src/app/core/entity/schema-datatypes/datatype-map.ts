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

import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { generateSubSchemaField } from "./datatype-array";

/**
 * Datatype for the EntitySchemaService transforming values of a javascript `Map` recursively.
 *
 * (De)serialize each value according to the given Datatype transformer, similar to how arrays are handled.
 *
 * For example:
 *
 * `@DatabaseField({ innerDataType: 'month' }) dateMap: Map<string, Date>;`
 * will ensure that in the database this property is saved as "month" date string for each key
 * using the {@link monthEntitySchemaDatatype} (e.g. resulting in `[['a', '2020-01'], ['b', '2020-04']]` in the database).
 */
export const mapEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "map",

  transformToDatabaseFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent,
  ) => {
    if (!(value instanceof Map)) {
      console.warn(
        'property to be saved with "map" EntitySchema is not of expected type',
        value,
      );
      return value;
    }

    const innerElementDatatype: EntitySchemaDatatype =
      schemaService.getDatatypeOrDefault(schemaField.innerDataType);
    const result = [];
    value.forEach((item, key) => {
      result.push([
        key,
        innerElementDatatype.transformToDatabaseFormat(
          item,
          generateSubSchemaField(schemaField),
          schemaService,
          parent,
        ),
      ]);
    });
    return result;
  },

  transformToObjectFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent,
  ) => {
    if (value instanceof Map) {
      // usually this shouldn't already be a map but in MockDatabase somehow this can happen
      return value;
    }
    if (!Array.isArray(value) || value === null) {
      console.warn(
        'property to be loaded with "map" EntitySchema is not valid',
        value,
      );
      return value;
    }

    const innerElementType: EntitySchemaDatatype =
      schemaService.getDatatypeOrDefault(schemaField.innerDataType);

    const result = new Map();
    for (const keyValue of value) {
      const transformedElement = innerElementType.transformToObjectFormat(
        keyValue[1],
        generateSubSchemaField(schemaField),
        schemaService,
        parent,
      );
      result.set(keyValue[0], transformedElement);
    }
    return result;
  },
};
