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
import { StringDatatype } from "../string/string.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ColumnMapping } from "../../import/column-mapping";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";

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
export class EntityDatatype extends StringDatatype {
  static dataType = "entity";
  editComponent = "EditSingleEntity";
  viewComponent = "DisplayEntity";
  importConfigComponent = "EntityImportConfig";

  constructor(
    private entityMapper: EntityMapperService,
    private removeService: EntityActionsService,
  ) {
    super();
  }

  importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: any,
  ) {
    if (!additional) {
      return Promise.resolve(undefined);
    }
    return this.entityMapper
      .loadType(schemaField.additional)
      .then((res) => res.find((e) => e[additional] === val)?.getId());
  }

  importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return col.additional ? undefined : "?";
  }

  /**
   * Recursively calls anonymize on the referenced entity and saves it.
   * @param value
   * @param schemaField
   * @param parent
   */
  async anonymize(
    value,
    schemaField: EntitySchemaField,
    parent,
  ): Promise<string> {
    const referencedEntity = await this.entityMapper.load(
      schemaField.additional,
      value,
    );

    if (!referencedEntity) {
      // TODO: remove broken references?
      return value;
    }

    await this.removeService.anonymize(referencedEntity);
    return value;
  }
}
