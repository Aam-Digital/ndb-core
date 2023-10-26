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
 * Datatype for the EntitySchemaService to handle multiple references to other entities
 * using EditEntityArrayComponent in the UI.
 * Stored as simple array of id strings.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'entity-array', additional: 'Child'}) relatedEntities: string[] = [];`
 */
@Injectable()
export class EntityArrayDatatype extends ArrayDatatype<string, string> {
  static dataType = "entity-array";

  editComponent = "EditEntityArray";
  viewComponent = "DisplayEntityArray";

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

    // TODO: maybe introduce a prefix transformation in the future (also see #1526)
    // this is only possible when no indices depend on un-prefixed IDs
    /*
    if (typeof schemaField.additional === "string") {
      // if only one clear EntityType, make sure IDs are prefixed even for legacy data
      return value.map((id) =>
        Entity.createPrefixedId(schemaField.additional, id)
      );
    } else {
      return value;
    }*/
  }

  async anonymize(value, schema: EntitySchemaField, parent) {
    return super.anonymize(
      value,
      { ...schema, innerDataType: EntityDatatype.dataType },
      parent,
    );
  }
}
