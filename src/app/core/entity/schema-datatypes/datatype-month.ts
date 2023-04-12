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
 * Datatype for the EntitySchemaService transforming Date values to/from a short string month format ("YYYY-mm").
 *
 * Throws an exception if the property is set to something that is not a Date instance and cannot be cast to Date either.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'month'}) myMonth: Date = new Date('2020-01-15'); // will be "2020-01" in the database`
 */
export const monthEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "month",
  // Property schemas should have `additional: "YYYY-MM"` to properly display the month
  viewComponent: "DisplayDate",
  editComponent: "EditMonth",

  transformToDatabaseFormat: (value) => {
    if (!(value instanceof Date)) {
      value = new Date(value);
    }
    return (
      value.getFullYear().toString() +
      "-" +
      (value.getMonth() + 1).toString().replace(/^(\d)$/g, "0$1")
    );
  },

  transformToObjectFormat: (value: string) => {
    const values = value.split("-").map((v) => Number(v));
    const date = new Date(values[0], values[1] - 1);
    if (Number.isNaN(date.getTime())) {
      throw new Error("failed to convert data to Date object: " + value);
    }
    return date;
  },
};
