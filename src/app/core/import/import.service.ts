import { inject, Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { ImportAdditionalService } from "./additional-actions/import-additional.service";
import { ImportExistingService } from "./update-existing/import-existing.service";
import { ImportProcessingContext } from "./import-processing-context";

/**
 * Supporting import of data from spreadsheets.
 */
@Injectable({
  providedIn: "root",
})
export class ImportService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityTypes = inject(EntityRegistry);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly importAdditionalService = inject(ImportAdditionalService);
  private readonly importExistingService = inject(ImportExistingService);

  async executeImport(
    entitiesToImport: Entity[],
    settings: ImportSettings,
  ): Promise<ImportMetadata> {
    await this.entityMapper.saveAll(entitiesToImport);
    await this.importAdditionalService.executeImport(
      entitiesToImport,
      settings,
    );
    return this.saveImportHistory(entitiesToImport, settings);
  }

  private async saveImportHistory(
    savedEntities: Entity[],
    settings: ImportSettings,
  ) {
    const importMeta = new ImportMetadata();
    importMeta.config = settings;

    importMeta.updatedEntities =
      this.importExistingService.getImportHistoryForUpdatedEntities(
        savedEntities,
        settings,
      );

    importMeta.createdEntities = savedEntities
      .filter(
        //skip those that have been updated instead of created
        (e) => !importMeta.updatedEntities.some((u) => u.id === e.getId()),
      )
      .map((e) => e.getId());

    await this.entityMapper.save(importMeta);
    return importMeta;
  }

  undoImport(item: ImportMetadata) {
    const removes = item.createdEntities.map((id) =>
      this.entityMapper
        .load(item.config.entityType, id)
        .then((e) => this.entityMapper.remove(e))
        .catch(() => undefined),
    );

    // Or should the ImportMetadata still be kept indicating that it has been undone?
    return Promise.all([
      ...removes,
      this.importExistingService.undoImport(item),
      this.importAdditionalService.undoImport(item),
      this.entityMapper.remove(item),
    ]);
  }

  /**
   * Use the given mapping to transform raw data into Entity instances that can be displayed or saved.
   * @param rawData
   * @param importSettings
   */
  async transformRawDataToEntities(
    rawData: any[],
    importSettings: ImportSettings,
  ): Promise<Entity[]> {
    if (
      !rawData ||
      !importSettings.entityType ||
      !importSettings.columnMapping
    ) {
      return [];
    }

    const entityConstructor = this.entityTypes.get(importSettings.entityType);

    const mappedEntities: Entity[] = [];
    const importProcessingContext = new ImportProcessingContext(importSettings);
    for (const row of rawData) {
      importProcessingContext.row = row;
      importProcessingContext.rowIndex++;

      const newEntity = await this.parseRow(
        row,
        entityConstructor,
        importSettings,
        importProcessingContext,
      );
      if (newEntity !== undefined) {
        mappedEntities.push(newEntity);
      }
    }

    return this.importExistingService.applyExistingEntitiesIfApplicable(
      mappedEntities,
      importSettings,
    );
  }

  /**
   * Parse a single row of imported raw data into an Entity instance.
   * If not a single property is mapped, undefined is returned.
   * @param row The raw data row to parse
   * @param entityConstructor The entity type to create
   * @param importSettings
   * @param importProcessingContext
   */
  private async parseRow(
    row: any,
    entityConstructor: EntityConstructor,
    importSettings: ImportSettings,
    importProcessingContext: ImportProcessingContext,
  ): Promise<Entity | undefined> {
    let entity = new entityConstructor();
    let hasMappedProperty = false; // to avoid empty records being created

    for (const col in row) {
      const mapping: ColumnMapping = importSettings.columnMapping.find(
        (c) => c.column === col,
      );
      if (!mapping) {
        continue;
      }

      const parsed = await this.parseCell(
        row[col],
        mapping,
        entity,
        importProcessingContext,
      );

      if (parsed === undefined) {
        continue;
      }

      entity[mapping.propertyName] = parsed;
      hasMappedProperty = true;
    }

    if (hasMappedProperty) {
      // only return entity if at least one property was mapped
      return entity;
    }
  }

  private async parseCell(
    val: any,
    mapping: ColumnMapping,
    entity: Entity,
    importProcessingContext: ImportProcessingContext,
  ) {
    if (val === undefined || val === null) {
      return undefined;
    }

    const schema = entity.getSchema().get(mapping.propertyName);
    if (!schema) {
      return undefined;
    }

    const datatype = this.schemaService.getDatatypeOrDefault(schema.dataType);
    let value;
    if (!schema.isArray) {
      value = await datatype.importMapFunction(
        val,
        schema,
        mapping.additional,
        importProcessingContext,
      );
    } else {
      // For array fields, split the value and map each item individually
      const separator =
        importProcessingContext.importSettings.additionalSettings
          ?.multiValueSeparator ?? ",";
      const rawValues = splitArrayValue(val, separator);
      value = [];
      for (const rawValue of rawValues) {
        const mapped = await datatype.importMapFunction(
          rawValue,
          {
            ...schema,
            isArray: false, // transform here only for single values, array mapping is handled here separately
          },
          mapping.additional,
          importProcessingContext,
        );
        if (mapped !== undefined && mapped !== null && mapped !== "") {
          value.push(mapped);
        }
      }
      // Filter duplicate values
      value = [...new Set(value)];
    }

    // ignore empty or invalid values for import
    if (
      (!value && value !== 0 && value !== false) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      // falsy values except 0 (=> null, undefined, empty string, NaN, ...)
      return undefined;
    }

    return value;
  }
}

/**
 * Split a raw value into an array of individual values.
 * Supports JSON arrays and separator-delimited strings.
 * @param val The raw value to split
 * @param separator The separator character to use for splitting (default: ",")
 * @returns Array of individual string values
 */
export function splitArrayValue(val: any, separator: string = ","): string[] {
  if (typeof val !== "string") {
    return [val];
  }

  val = val.trim();
  // Try parsing as JSON array first
  if (val.startsWith("[")) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON, fall through to separator-based parsing
    }
  }

  // Split by separator and trim whitespace
  return val.split(separator).map((item) => item.trim());
}
