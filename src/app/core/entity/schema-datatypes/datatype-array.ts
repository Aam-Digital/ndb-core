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

/**
 * Datatype for the EntitySchemaService transforming values of an array recursively.
 *
 * (De)serialize each item in an array according to the given Datatype transformer.
 *
 * As TypeScript array types are not reliable, you have to explicitly configure the dataType for array items with the annotation.
 * For example:
 *
 * `@DatabaseField({ innerDataType: 'month' }) dateArr: Date[];`
 * will ensure that in the database this property is saved as an array of "month" date strings
 * using the {@link monthEntitySchemaDatatype} (e.g. resulting in `['2020-01', '2020-04']` in the database).
 */
export const arrayEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "array",

  transformToDatabaseFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent
  ) => {
    if (!Array.isArray(value)  || !value.length) {
      console.warn(
        `property to be transformed with "array" EntitySchema is not an array or empty`,
        value,
        parent
      );
      return undefined;
    }

    const arrayElementDatatype: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(
      schemaField.innerDataType
    );
    return value.map((el) =>
      arrayElementDatatype.transformToDatabaseFormat(
        el,
        generateSubSchemaField(schemaField),
        schemaService,
        parent
      )
    );
  },

  transformToObjectFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent
  ) => {
    if (!Array.isArray(value)) {
      console.warn(
        'property to be transformed with "array" EntitySchema is not an array',
        value,
        parent
      );
      return value;
    }

    const arrayElementDatatype: EntitySchemaDatatype = schemaService.getDatatypeOrDefault(
      schemaField.innerDataType
    );

    return value.map((el) =>
      arrayElementDatatype.transformToObjectFormat(
        el,
        generateSubSchemaField(schemaField),
        schemaService,
        parent
      )
    );
  },
};

/**
 * Generate an EntitySchemaField configuration object for the recursively called datatype for array items
 * based on the given main config for the array datatype.
 * @ignore
 *
 * @param arraySchemaField The schema field config as received by the array datatype from the annotation
 */
export function generateSubSchemaField(arraySchemaField: EntitySchemaField) {
  const subSchemaField = Object.assign({}, arraySchemaField);
  subSchemaField.dataType = arraySchemaField.innerDataType;
  delete subSchemaField.innerDataType;
  return subSchemaField;
}
