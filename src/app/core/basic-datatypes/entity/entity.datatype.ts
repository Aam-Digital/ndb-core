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

import { inject, Injectable } from "@angular/core";
import { StringDatatype } from "../string/string.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { Logging } from "app/core/logging/logging.service";
import { ImportProcessingContext } from "../../import/import-processing-context";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

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
  private entityMapper = inject(EntityMapperService);
  private removeService = inject(EntityActionsService);
  private schemaService = inject(EntitySchemaService);

  static override dataType = "entity";
  static override label: string = $localize`:datatype-label:link to another record`;
  override editComponent = "EditEntity";
  override viewComponent = "DisplayEntity";
  override importConfigComponent = "EntityImportConfig";
  override importAllowsMultiMapping = true;

  /**
   * Maps a value from an import to an actual entity in the database by comparing the value with the given field of entities.
   * Handles type conversion between numbers and strings to improve matching.
   *
   * @param val The value from an import that should be mapped to an entity reference.
   * @param schemaField The config defining details of the field that will hold the entity reference after mapping.
   * @param additional The field of the referenced entity that should be compared with the val. (e.g. if we run importMapFunction for a field that is an entity-reference to a "School" entity, this could be "name" if the "School" entity has a "name" property and the import should use that name to match the correct school)
   * @param importProcessingContext context to share information across calls for multiple columns and rows.
   * @returns Promise resolving to the ID of the matched entity or undefined if no match is found.
   */
  override async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional: string,
    importProcessingContext: ImportProcessingContext,
  ): Promise<string | undefined> {
    if (!additional || val == null) {
      return undefined;
    }

    const context = new EntityFieldImportContext(
      importProcessingContext,
      schemaField,
    );

    await this.loadImportMapEntities(schemaField.additional, context);

    // find all columns that map to this schemaField from importProcessingContext
    // and filter entities accordingly (for all conditions)
    for (const colMapping of importProcessingContext.importSettings.columnMapping.filter(
      (m) => m.propertyName === schemaField.id,
    )) {
      const colValue = importProcessingContext.row[colMapping.column];

      context.filteredEntities = context.filteredEntities.filter(
        (entity) =>
          normalizeValue(entity[colMapping.additional]) ===
          normalizeValue(colValue),
      );
    }

    if (context.filteredEntities.length === 1) {
      return context.filteredEntities[0]._id;
    } else {
      if (context.filteredEntities.length > 1) {
        Logging.debug(
          "No unique match found in EntityDatatype importMapFunction",
          context.filteredEntities.length,
        );
      }
      return undefined;
    }
  }

  /**
   * Load the required entity type's entities into context's cache if not available yet.
   * @private
   */
  private async loadImportMapEntities(
    entityType: string,
    context: EntityFieldImportContext,
  ) {
    if (context.entities) {
      return;
    }

    try {
      context.entities = (await this.entityMapper.loadType(entityType)).map(
        (e) => this.schemaService.transformEntityToDatabaseFormat(e),
      );
    } catch (error) {
      Logging.error("Error in EntityDatatype importMapFunction:", error);
      return undefined;
    }
  }

  /**
   * Recursively calls anonymize on the referenced entity and saves it.
   * @param value
   * @param schemaField
   * @param parent
   */
  override async anonymize(
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

/**
 * Normalizes a value for comparison, converting it to a standardized string format.
 * Ensures both numbers and strings are treated consistently.
 *
 * @param val The value to normalize.
 * @returns The normalized value as a string.
 */
function normalizeValue(val: any): string {
  if (val == null) {
    return "";
  }
  return String(val).trim().toLowerCase(); // Convert everything to string and trim spaces
}

/**
 * Manage cache access to the current import processing context.
 */
class EntityFieldImportContext {
  private contextKey: string;

  constructor(
    private globalContext: ImportProcessingContext,
    private schemaField: EntitySchemaField,
  ) {
    this.contextKey = `${schemaField.id}_${globalContext.rowIndex}`;

    if (!globalContext[this.contextKey]) {
      globalContext[this.contextKey] = {};
    }
  }

  /**
   * Entities (in database format for easier comparison!)
   */
  get entities(): any[] | undefined {
    return this.globalContext[`entities_${this.schemaField.additional}`];
  }

  set entities(value: any[]) {
    this.globalContext[`entities_${this.schemaField.additional}`] = value;
  }

  /**
   * Entities already filter by any other column conditions
   * (in database format for easier comparison!)
   */
  get filteredEntities(): any[] {
    return (
      this.globalContext[this.contextKey].filteredEntities ??
      this.entities ??
      []
    );
  }

  set filteredEntities(value: any[]) {
    this.globalContext[this.contextKey].filteredEntities = value;
  }
}
