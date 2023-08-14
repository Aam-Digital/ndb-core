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

import { DefaultDatatype } from "../schema/default.datatype";
import { Injectable } from "@angular/core";

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
@Injectable()
export class NumberDatatype extends DefaultDatatype<number, number> {
  static dataType = "number";
  editComponent = "EditNumber";

  transformToDatabaseFormat(value) {
    return Number(value);
  }

  transformToObjectFormat(value) {
    return Number(value);
  }
}
