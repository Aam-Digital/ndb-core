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
import { splitArrayValue } from "../../import/split-array-value";
import { ColumnMapping } from "../../import/column-mapping";
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
   * Matches an import row to actual entities in the database
   * (per-field entry point, see DefaultDatatype.importMatchField).
   *
   * Splits every mapped column's cell into individual values, resolves any
   * per-column value mapping, then searches candidate entities for each
   * combination of one value per column:
   *
   * Case target field isArray===false:
   * simple:
   *  IMPORT: { x: "x1", y: "y1" }
   *  --> matches { x: "x1", y: "y1" } (if there is a single unique match)
   * complex, multi-value import:
   *  IMPORT: { x: "x1,x2", y: "y1,y2" }
   *  --> matches { x1, y1 } OR { x2, y2 } OR { x1, y2 } OR { x2, y1 } (if there is a single combination that matches)
   *
   * Case target field isArray===true:
   * simple:
   *  IMPORT: { x: "x1", y: "y1" }
   *  --> matches every record with { x: "x1", y: "y1" }
   * complex, multi-value import:
   *  IMPORT: { x: "x1,x2", y: "y1,y2" }
   *  --> matches every record for any combination { x1, y1 }, { x2, y2 }, { x1, y2 }, { x2, y1 }
   *
   * @param schemaField the target field the value(s) are imported into
   * @param columns every column mapped to this field, with its raw cell value
   * @param importProcessingContext context shared across columns and rows
   * @returns the id of the single match (isArray=false) or the deduped ids of
   *   all matches (isArray=true), or undefined / [] if nothing matched
   */
  override async importMatchField(
    schemaField: EntitySchemaField,
    columns: { mapping: ColumnMapping; rawCell: any }[],
    importProcessingContext: ImportProcessingContext,
  ): Promise<string | string[] | undefined> {
    const context = new EntityFieldImportContext(
      importProcessingContext,
      schemaField,
    );
    await this.loadImportMapEntities(schemaField.additional, context);
    const candidates = context.entities ?? [];

    const separator =
      importProcessingContext.importSettings.additionalSettings
        ?.multiValueSeparator ?? ",";

    // one list of comparison values per mapped column
    const columnValueLists: { refField: string; values: string[] }[] = [];
    for (const { mapping, rawCell } of columns) {
      const config = normalizeEntityAdditional(mapping.additional);
      if (!config?.refField) {
        // column not usable as an identifier for this field
        continue;
      }

      const enableSplitting = mapping.additional?.enableSplitting ?? true;
      const rawValues =
        rawCell == null
          ? []
          : enableSplitting
            ? splitArrayValue(rawCell, separator)
            : [rawCell];

      const values: string[] = [];
      for (const rawValue of rawValues) {
        values.push(
          await this.resolveColumnValue(
            rawValue,
            config.refField,
            config.valueMapping,
            context,
            importProcessingContext,
          ),
        );
      }
      // a mapped identifier column with no value can never match, so keep it as
      // an (empty) criterion rather than dropping it (blocks incomplete rows)
      columnValueLists.push({
        refField: config.refField,
        values: values.length ? values : [""],
      });
    }

    if (columnValueLists.length === 0) {
      return schemaField.isArray ? [] : undefined;
    }

    const matches = this.findMatchingEntities(candidates, columnValueLists);

    if (schemaField.isArray) {
      return matches.map((entity) => entity._id);
    }
    if (matches.length === 1) {
      return matches[0]._id;
    }
    if (matches.length > 1) {
      Logging.debug(
        "No unique match found in EntityDatatype importMatchField",
        matches.length,
      );
    }
    return undefined;
  }

  /**
   * Returns the distinct entities matched by any combination of one comparison
   * value per column (cartesian product of the columns' value lists).
   */
  private findMatchingEntities(
    candidates: any[],
    columnValueLists: { refField: string; values: string[] }[],
  ): any[] {
    let combinations: Record<string, string>[] = [{}];
    for (const { refField, values } of columnValueLists) {
      combinations = combinations.flatMap((combination) =>
        values.map((value) => ({ ...combination, [refField]: value })),
      );
    }

    const matched: any[] = [];
    const seen = new Set<string>();
    for (const combination of combinations) {
      for (const entity of candidates) {
        const isMatch = Object.entries(combination).every(
          ([refField, value]) => normalizeValue(entity[refField]) === value,
        );
        if (isMatch && !seen.has(entity._id)) {
          seen.add(entity._id);
          matched.push(entity);
        }
      }
    }
    return matched;
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
  constructor(
    private globalContext: ImportProcessingContext,
    private schemaField: EntitySchemaField,
  ) {}

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
}
