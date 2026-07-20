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
import { Logging } from "../logging/logging.service";

/**
 * Details about a single cell transformation error during import.
 */
export interface ImportCellError {
  /** The column name in the raw data */
  column: string;
  /** The entity property name the column is mapped to */
  propertyName: string;
  /** The row index (0-based) where the error occurred */
  rowIndex: number;
  /** The original error */
  error: unknown;
}

/**
 * Result of transforming raw data to entities, including any errors that occurred.
 */
export interface ImportTransformationResult {
  entities: Entity[];
  /** Errors that occurred during value transformation (affected cells were skipped) */
  errors: ImportCellError[];
}

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
  ): Promise<ImportTransformationResult> {
    if (
      !rawData ||
      !importSettings.entityType ||
      !importSettings.columnMapping
    ) {
      return { entities: [], errors: [] };
    }

    const entityConstructor = this.entityTypes.get(importSettings.entityType);

    const mappedEntities: Entity[] = [];
    const errors: ImportCellError[] = [];
    const importProcessingContext = new ImportProcessingContext(importSettings);
    for (const row of rawData) {
      importProcessingContext.row = row;
      importProcessingContext.rowIndex++;

      const newEntity = await this.parseRow(
        row,
        entityConstructor,
        importSettings,
        importProcessingContext,
        errors,
      );
      if (newEntity !== undefined) {
        mappedEntities.push(newEntity);
      }
    }

    const entities =
      await this.importExistingService.applyExistingEntitiesIfApplicable(
        mappedEntities,
        importSettings,
      );
    return { entities, errors };
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
    errors: ImportCellError[],
  ): Promise<Entity | undefined> {
    let entity = new entityConstructor();
    let hasMappedProperty = false; // to avoid empty records being created

    // group mappings by target property so datatypes that match across multiple
    // columns (see importMatchField) see all their columns at once. All mapped
    // columns are kept (even ones missing from this row) so a missing identifier
    // can still block a match.
    const mappingsByProperty = new Map<string, ColumnMapping[]>();
    for (const mapping of importSettings.columnMapping) {
      if (!mapping?.propertyName) {
        continue;
      }
      const group = mappingsByProperty.get(mapping.propertyName) ?? [];
      group.push(mapping);
      mappingsByProperty.set(mapping.propertyName, group);
    }

    for (const [propertyName, mappings] of mappingsByProperty) {
      const schema = entity.getSchema().get(propertyName);
      if (!schema) {
        continue;
      }

      let value;
      try {
        // failSilently: false - a broken/unknown dataType should surface as a
        // clear import error (caught below) rather than silently importing the
        // raw, untransformed value into a field of an unknown type.
        const datatype = this.schemaService.getDatatypeOrDefault(
          schema.dataType,
          false,
        );
        value = await datatype.importMatchField(
          schema,
          mappings.map((mapping) => ({
            mapping,
            rawCell: row[mapping.column],
          })),
          importProcessingContext,
        );
      } catch (e) {
        errors.push({
          column: mappings[0].column,
          propertyName,
          rowIndex: importProcessingContext.rowIndex,
          error: e,
        });
        continue;
      }

      // ignore empty or invalid values for import (falsy except 0 / false, or empty array)
      if (
        (!value && value !== 0 && value !== false) ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }
      entity[propertyName] = value;
      hasMappedProperty = true;
    }

    if (hasMappedProperty) {
      // only return entity if at least one property was mapped
      return entity;
    }
  }
}
