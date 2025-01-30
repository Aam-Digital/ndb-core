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
import { Logging } from "app/core/logging/logging.service";

/**
 * Datatype for the EntitySchemaService to handle a single reference to another entity.
 * Stored as a simple ID string.
 *
 * Example:
 *
 * `@DatabaseField({dataType: 'entity', additional: 'Child'}) relatedEntity: string;`
 */
@Injectable()
export class EntityDatatype extends StringDatatype {
  static override dataType = "entity";
  static override label: string = $localize`:datatype-label:link to another record`;

  override editComponent = "EditEntity";
  override viewComponent = "DisplayEntity";
  override importConfigComponent = "EntityImportConfig";

  constructor(
    private entityMapper: EntityMapperService,
    private removeService: EntityActionsService
  ) {
    super();
  }

  /**
   * Maps a value from an import to an actual entity in the database by comparing the value with the given field of entities.
   * Handles type conversion between numbers and strings to improve matching.
   *
   * @param val The value from an import that should be mapped to an entity reference.
   * @param schemaField The config defining details of the field that will hold the entity reference after mapping.
   * @param additional The field of the referenced entity that should be compared with the val.
   * @returns Promise resolving to the ID of the matched entity or undefined if no match is found.
   */
  override async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: string
  ): Promise<string | undefined> {
    if (!additional || val == null) {
      return undefined;
    }

    const normalizedVal = this.normalizeValue(val);

    try {
      const entities = await this.entityMapper.loadType(schemaField.additional);
      const matchedEntity = entities.find((entity) => {
        const entityFieldValue = this.normalizeValue(entity[additional]);
        return entityFieldValue === normalizedVal;
      });

      return matchedEntity?.getId();
    } catch (error) {
      Logging.error("Error in EntityDatatype importMapFunction:", error);
      return undefined;
    }
  }

  /**
   * Normalizes a value for comparison, converting it to a string or number.
   * @param val The value to normalize.
   * @returns The normalized value as a string or number.
   */
  private normalizeValue(val: any): string | number {
    if (typeof val === "string" || typeof val === "number") {
      return val;
    }
    
    const numVal = Number(val);
    return !isNaN(numVal) ? numVal : String(val);
  }

  /**
   * Returns a badge indicator if additional config is missing.
   * @param col The column mapping object.
   * @returns "?" if additional config is missing, otherwise undefined.
   */
  override importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return col.additional ? undefined : "?";
  }

  /**
   * Recursively anonymizes a referenced entity.
   * @param value The entity reference value.
   * @param schemaField The schema field containing reference details.
   * @param parent The parent entity (not used in this method).
   * @returns The original value if anonymization is successful.
   */
  override async anonymize(
    value: string,
    schemaField: EntitySchemaField,
    parent: any
  ): Promise<string> {
    try {
      const referencedEntity = await this.entityMapper.load(
        schemaField.additional,
        value
      );
      
      if (!referencedEntity) {
        return value;
      }

      await this.removeService.anonymize(referencedEntity);
      return value;
    } catch (error) {
      Logging.error("Error in EntityDatatype anonymize:", error);
      return value;
    }
  }
}
