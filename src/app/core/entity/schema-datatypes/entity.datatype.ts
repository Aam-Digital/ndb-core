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
import { EntitySchemaField } from "../schema/entity-schema-field";

/**
 * Datatype for the EntitySchemaService to handle a single reference to another entity
 * using EditSingleEntityComponent in the UI.
 * Stored as simple id string.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'entity', additional: 'Child'}) relatedEntity: string;`
 */
@Injectable()
export class EntityDatatype extends DefaultDatatype<string, string> {
  static dataType = "entity";
  editComponent = "EditSingleEntity";
  viewComponent = "DisplayEntity";

  transformToDatabaseFormat(value) {
    return value;
  }

  transformToObjectFormat(value, schemaField: EntitySchemaField, parent) {
    return value;
  }
}
