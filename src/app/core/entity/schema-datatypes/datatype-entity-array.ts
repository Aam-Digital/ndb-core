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
 * Datatype for the EntitySchemaService to handle multiple references to other entities
 * using EditEntityArrayComponent in the UI.
 * Stored as simple array of id strings.
 *
 * For example:
 *
 * `@DatabaseField({dataType: 'entity-array', additional: 'Child'}) relatedEntities: string[] = [];`
 */
export const entityArrayEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "entity-array",
  editComponent: "EditEntityArray",
  viewComponent: "DisplayEntityArray",

  transformToDatabaseFormat: (value) => {
    if (!Array.isArray(value)) {
      console.warn(
        `property to be transformed with "entity-array" EntitySchema is not an array`,
        value,
        parent,
      );
    }

    return value;
  },

  transformToObjectFormat: (
    value: any[],
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent,
  ) => {
    if (!Array.isArray(value)) {
      console.warn(
        //TODO: should this be a sentry error instead?
        'property to be transformed with "entity-array" EntitySchema is not an array',
        value,
        parent,
      );
      return value;
    }

    return value;

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
  },
};
