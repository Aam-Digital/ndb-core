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
 * Datatype for the EntitySchemaService transforming Date values to/from a date string format ("YYYY-mm-dd").
 *
 * Throws an exception if the property is set to something that is not a Date instance and cannot be cast to Date either.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'date-only'}) myDate: Date = new Date('2020-01-15'); // will be "2020-01-15" (without time) in the database`
 */
export const dateOnlyEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "date-only",
  viewComponent: "DisplayDate",
  editComponent: "EditDate",

  transformToDatabaseFormat: (value: Date) => {
    if (!(value instanceof Date)) {
      return undefined;
    }
    return (
      value.getFullYear() +
      "-" +
      (value.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      value.getDate().toString().padStart(2, "0")
    );
  },

  transformToObjectFormat: (value: string) => {
    // new Date("2022-01-01") is interpreted as UTC time whereas new Date(2022, 0, 1) is local time
    // -> we want local time to represent the same day wherever used.
    const values = value.split("-").map((v) => Number(v));
    const date = new Date(values[0], values[1] - 1, values[2]);
    if (Number.isNaN(date.getTime())) {
      throw new Error("failed to convert data to Date object: " + value);
    }
    return date;
  },
};
