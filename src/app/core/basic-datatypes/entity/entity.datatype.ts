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
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ExportColumnMapping } from "../../entity/default-datatype/default.datatype";
import { EntityRegistry } from "../../entity/database-entity.decorator";

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
  private readonly entityRegistry = inject(EntityRegistry);

  static override dataType = "entity";
  static override label: string = $localize`:datatype-label:link to another record`;
  override editComponent = "EditEntity";
  override viewComponent = "DisplayEntity";
  override importConfigComponent = "EntityImportConfig";
  override importAllowsMultiMapping = true;

  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping[] {
    if (!schemaField.label) {
      return [];
    }

    return [
      {
        keySuffix: "",
        label: schemaField.label,
        resolveValue: (value) => value,
      },
      {
        keySuffix: "_readable",
        label: schemaField.label + " (readable)",
        resolveValue: async (value: string | string[]) =>
          this.loadRelatedEntitiesToString(value, schemaField),
      },
    ];
  }

  /**
   * Maps a value from an import to an actual entity in the database.
   *
   * Finds all column mappings targeting this field, resolves each column's comparison value
   * (applying any configured value mapping), and progressively filters candidate entities
   * until a unique match is found.
   *
   * @param val The value from an import that should be mapped to an entity reference.
   * @param schemaField The config defining details of the field that will hold the entity reference after mapping.
   * @param additional The field of the referenced entity that should be compared with the val.
   *   Can be a plain string (legacy) or an object `{ refField: string, valueMapping?: any }`.
   * @param importProcessingContext context to share information across calls for multiple columns and rows.
   * @returns Promise resolving to the ID of the matched entity or undefined if no match is found.
   */
  override async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional: string | EntityAdditional,
    importProcessingContext: ImportProcessingContext,
  ): Promise<string | undefined> {
    const fieldConfig = normalizeEntityAdditional(additional);
    if (!fieldConfig?.refField || val == null) {
      return undefined;
    }

    const context = new EntityFieldImportContext(
      importProcessingContext,
      schemaField,
    );

    await this.loadImportMapEntities(schemaField.additional, context);

    const columnMappings = this.getColumnMappingsForField(
      schemaField.id,
      importProcessingContext,
    );

    for (const mapping of columnMappings) {
      const mappingConfig = normalizeEntityAdditional(mapping.additional);
      const rawValue = importProcessingContext.row[mapping.column];

      const expectedValue = await this.resolveColumnValue(
        rawValue,
        mappingConfig?.refField,
        mappingConfig?.valueMapping,
        context,
        importProcessingContext,
      );

      context.filteredEntities = context.filteredEntities.filter(
        (entity) =>
          normalizeValue(entity[mappingConfig?.refField]) === expectedValue,
      );
    }

    return this.pickSingleMatch(context.filteredEntities);
  }

  /**
   * Returns all column mappings that target the given field.
   */
  private getColumnMappingsForField(
    fieldId: string,
    importProcessingContext: ImportProcessingContext,
  ) {
    return importProcessingContext.importSettings.columnMapping.filter(
      (m) => m.propertyName === fieldId,
    );
  }

  /**
   * Resolves the effective comparison value for a column,
   * applying any configured value mapping through the referenced field's datatype.
   */
  private async resolveColumnValue(
    rawValue: any,
    refField: string,
    valueMapping: any | undefined,
    context: EntityFieldImportContext,
    importProcessingContext: ImportProcessingContext,
  ): Promise<string> {
    if (valueMapping === undefined) {
      return normalizeValue(rawValue);
    }

    const refFieldSchema = context.refEntityCtor?.schema?.get(refField);
    const refDatatype = refFieldSchema
      ? this.schemaService.getDatatypeOrDefault(refFieldSchema.dataType)
      : null;

    if (!refDatatype) {
      return normalizeValue(rawValue);
    }

    const mappedValue = await refDatatype.importMapFunction(
      rawValue,
      refFieldSchema,
      valueMapping,
      importProcessingContext,
    );
    const dbFormat = refDatatype.transformToDatabaseFormat(
      mappedValue,
      refFieldSchema,
    );
    return normalizeValue(dbFormat);
  }

  /**
   * Returns the entity ID if exactly one candidate remains, otherwise undefined.
   */
  private pickSingleMatch(candidates: any[]): string | undefined {
    if (candidates.length === 1) {
      return candidates[0]._id;
    }
    if (candidates.length > 1) {
      Logging.debug(
        "No unique match found in EntityDatatype importMapFunction",
        candidates.length,
      );
    }
    return undefined;
  }

  /**
   * Load the required entity type's entities into context's cache if not available yet.
   */
  private async loadImportMapEntities(
    entityType: string,
    context: EntityFieldImportContext,
  ): Promise<void> {
    if (context.entities) {
      return;
    }

    try {
      context.entities = (await this.entityMapper.loadType(entityType)).map(
        (e) => this.schemaService.transformEntityToDatabaseFormat(e),
      );
      context.refEntityCtor = this.entityRegistry.get(entityType);
    } catch (error) {
      Logging.error("Error loading entities for import mapping:", error);
      context.entities = [];
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

  private async loadRelatedEntitiesToString(
    value: string | string[],
    schemaField: EntitySchemaField,
  ): Promise<string[]> {
    if (!value) return [];

    const relatedEntitiesToStrings: string[] = [];

    const relatedEntitiesIds: string[] = Array.isArray(value) ? value : [value];
    for (const relatedEntityId of relatedEntitiesIds) {
      const entityType =
        Entity.extractTypeFromId(relatedEntityId) || schemaField.additional;
      const relatedEntity = await this.entityMapper
        .load(entityType, relatedEntityId)
        .catch(() => undefined);

      relatedEntitiesToStrings.push(relatedEntity?.toString() ?? "<not_found>");
    }

    return relatedEntitiesToStrings;
  }
}

/**
 * Structure for the `additional` field of an entity reference ColumnMapping.
 * Can be a plain string (legacy) or an object with optional valueMapping config.
 */
export interface EntityAdditional {
  /** The property of the referenced entity to match against the import value. */
  refField: string;
  /** Optional: additional config for transforming the import value (passed to the sub-field's importMapFunction). */
  valueMapping?: any;
}

/**
 * Normalizes the `additional` config of an entity reference column mapping.
 * Accepts legacy string format or new object format.
 */
export function normalizeEntityAdditional(
  additional: string | EntityAdditional | any,
): EntityAdditional | undefined {
  if (!additional) {
    return undefined;
  }
  if (typeof additional === "string") {
    return { refField: additional };
  }
  return additional as EntityAdditional;
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
   * Constructor of the referenced entity type (to access schema for value mapping)
   */
  get refEntityCtor(): EntityConstructor | undefined {
    return this.globalContext[`ctor_${this.schemaField.additional}`];
  }

  set refEntityCtor(value: EntityConstructor) {
    this.globalContext[`ctor_${this.schemaField.additional}`] = value;
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
