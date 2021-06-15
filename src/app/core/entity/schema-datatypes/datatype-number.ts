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

/**
 * Datatype for the EntitySchemaService transforming values to "number".
 *
 * This type is automatically used if you annotate a class's property that has the TypeScript type "number"
 * ensuring that even if values in the database from other sources are not of type number they will be cast to number.
 *
 * For example:
 *
 * `@DatabaseField() myNumber: number;`
 *
 * `@DatabaseField({dataType: 'number'}) myValue: any;`
 */
export const numberEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "number",

  transformToDatabaseFormat: (value) => {
    // check if falsy except for 0
    if(value !== 0 && !value){
      console.warn(
        `property to be transformed with "number" EntitySchema is falsy`,
        value
      );
      return undefined;
    }
    return Number(value);
  },

  transformToObjectFormat: (value) => {
    return Number(value);
  },
};
