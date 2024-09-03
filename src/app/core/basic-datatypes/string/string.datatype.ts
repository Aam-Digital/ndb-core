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

import { Injectable } from "@angular/core";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";

/**
 * Datatype for the EntitySchemaService transforming values to "string".
 *
 * This type is automatically used if you annotate a class's property that has the TypeScript type "string"
 * ensuring that even if values in the database from other sources are not of type string, the property will be a string.
 *
 * For example:
 *
 * `@DatabaseField() myString: string;`
 *
 * `@DatabaseField({dataType: 'string'}) myValue: any;`
 */
@Injectable()
export class StringDatatype extends DefaultDatatype<string, string> {
  static override dataType = "string";
  static override label: string = $localize`:datatype-label:text`;

  override transformToDatabaseFormat(value) {
    return String(value);
  }

  override transformToObjectFormat(value) {
    return String(value);
  }
}
