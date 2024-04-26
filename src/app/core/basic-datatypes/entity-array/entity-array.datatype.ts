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

import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Injectable } from "@angular/core";
import { EntityDatatype } from "../entity/entity.datatype";
import { ArrayDatatype } from "../array/array.datatype";

/**
 * Datatype for the EntitySchemaService to handle multiple references to other entities.
 * Stored as simple array of id strings.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'entity-array', additional: 'Child'}) relatedEntities: string[] = [];`
 */
@Injectable()
export class EntityArrayDatatype extends ArrayDatatype<string, string> {
  static override dataType = "entity-array";
  static override label: string = $localize`:datatype-label:link to other records (multi-select)`;

  editComponent = "EditEntity";
  viewComponent = "DisplayEntity";

  transformToDatabaseFormat(value, schema: EntitySchemaField, parent) {
    return super.transformToDatabaseFormat(
      value,
      { ...schema, innerDataType: EntityDatatype.dataType },
      parent,
    );
  }

  transformToObjectFormat(value, schema: EntitySchemaField, parent) {
    return super.transformToObjectFormat(
      value,
      { ...schema, innerDataType: EntityDatatype.dataType },
      parent,
    );
  }

  async anonymize(value, schema: EntitySchemaField, parent) {
    return super.anonymize(
      value,
      { ...schema, innerDataType: EntityDatatype.dataType },
      parent,
    );
  }
}
