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
 * `@DatabaseField({ arrayDataType: 'month' }) dateMap: Map<string, Date>;`
 * will ensure that in the database this property is saved as "month" date string for each key
 * using the {@link monthEntitySchemaDatatype} (e.g. resulting in `{'a': '2020-01', 'b': '2020-04'}` in the database).
 */
export const mapEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "map",

  transformToDatabaseFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent
  ) => {
    if (!(value instanceof Map)) {
      console.warn(
        'property to be transformed with "map" EntitySchema is not of expected type',
        value
      );
      return value;
    }

    const innerElementDatatype: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(
      schemaField.arrayDataType
    );
    const result = {};
    value.forEach((item, key) => {
      result[key] = innerElementDatatype.transformToDatabaseFormat(
        item,
        generateSubSchemaField(schemaField),
        schemaService,
        parent
      );
    });
    return result;
  },

  transformToObjectFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent
  ) => {
    if (typeof value !== "object" || value === null) {
      console.warn(
        'property to be transformed with "map" EntitySchema is not an object',
        value
      );
      return value;
    }

    const innerElementType: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(
      schemaField.arrayDataType
    );

    const result = new Map();
    for (const key of Object.keys(value)) {
      const transformedElement = innerElementType.transformToObjectFormat(
        value[key],
        generateSubSchemaField(schemaField),
        schemaService,
        parent
      );
      result.set(key, transformedElement);
    }
    return result;
  },
};
