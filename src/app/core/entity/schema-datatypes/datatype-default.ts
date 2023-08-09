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

import { AbstractDatatype } from "../schema/entity-schema-datatype";
import { Injectable } from "@angular/core";

/**
 * The default fallback Datatype for the EntitySchemaService that keeps values unchanged between database and entity instance.
 *
 * This type is automatically used whenever no fitting Datatype can be found for that config or TypeScript type.
 */
@Injectable()
export class DefaultDatatype extends AbstractDatatype {
  static dataType = "any";

  viewComponent = "DisplayText";
  editComponent = "EditText";

  transformToDatabaseFormat(value) {
    return value;
  }

  transformToObjectFormat(value) {
    return value;
  }
}
