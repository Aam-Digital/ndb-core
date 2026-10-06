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
 * The records of a batch that were stored although the save as a whole was rejected.
 *
 * `saveAll` rejects *with* its results when single documents failed, so the outcome of
 * every record is known; it rejects with anything else when the write did not happen
 * at all, in which case none of them were stored.
 */
function storedRecordsOf(batch: Entity[], error: unknown): Entity[] {
  if (!Array.isArray(error)) {
    return [];
  }

  const storedIds = new Set(
    error.filter((result) => result?.ok).map((result) => result.id),
  );
  return batch.filter((entity) => storedIds.has(entity.getId()));
}

/**
 * Thrown when an import failed after part of its records had already been saved.
 *
 * A failed import used to mean that nothing was written, so retrying the file was
 * always safe. Since records are saved in batches (see {@link ImportService}) that no
 * longer holds, and the user has to be told what did get imported - otherwise they
 * re-run the whole file and duplicate it.
 */
export class PartialImportError extends Error {
  constructor(
    /** number of records that were saved before the import failed */
    readonly importedCount: number,
    /** number of records the import was started with */
    readonly totalCount: number,
    /** the history entry recorded for the saved records, to review and undo them */
    readonly completedImport: ImportMetadata | undefined,
    cause: unknown,
  ) {
    super("Import failed after part of the records had been saved", { cause });
  }
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

  /**
   * How many records are written to the database in one go.
   *
   * This is not what keeps a single request within the server's size limit: the
   * database layer splits a write further by the size of the documents (see
   * `RemotePouchDatabase`), which a count cannot do because a record's size depends on
   * the imported columns. What a batch bounds is how much of an import is lost when a
   * write fails partway - everything up to the last completed batch is saved, and
   * recorded in the import history so it can be reviewed and undone.
   *
   * It is kept well below the database layer's own limits, so that a batch is
   * normally written as a single request: only then is "the last completed batch"
   * exactly what reached the server. Records of the *failing* batch can still have
   * been written if the database layer had to split that one too, which takes
   * records averaging tens of kilobytes - rare enough to accept, and bounded by
   * this batch size.
   */
  private readonly SAVE_BATCH_SIZE = 100;

  async executeImport(
    entitiesToImport: Entity[],
    settings: ImportSettings,
  ): Promise<ImportMetadata> {
    const savedEntities = await this.saveInBatches(entitiesToImport, settings);
    await this.importAdditionalService.executeImport(savedEntities, settings);
    return this.saveImportHistory(savedEntities, settings);
  }

  /**
   * Save the entities batch by batch (see {@link SAVE_BATCH_SIZE}).
   *
   * If a batch fails, the records saved so far are recorded in the import history
   * before the failure is passed on: a partial import that no history entry mentions
   * could neither be recognised nor undone, leaving the user to find the imported
   * records one by one.
   */
  private async saveInBatches(
    entitiesToImport: Entity[],
    settings: ImportSettings,
  ): Promise<Entity[]> {
    const savedEntities: Entity[] = [];

    for (let i = 0; i < entitiesToImport.length; i += this.SAVE_BATCH_SIZE) {
      const batch = entitiesToImport.slice(i, i + this.SAVE_BATCH_SIZE);
      try {
        await this.entityMapper.saveAll(batch);
      } catch (error) {
        // a batch can fail for single records only (e.g. an unresolved conflict)
        // while storing the rest, so the history must not lose those either
        savedEntities.push(...storedRecordsOf(batch, error));
        throw await this.handleFailedBatch(
          error,
          savedEntities,
          entitiesToImport,
          settings,
        );
      }
      savedEntities.push(...batch);
    }

    return savedEntities;
  }

  /**
   * Record what was imported before the failure and return the error to throw for it.
   */
  private async handleFailedBatch(
    error: unknown,
    savedEntities: Entity[],
    entitiesToImport: Entity[],
    settings: ImportSettings,
  ): Promise<unknown> {
    if (savedEntities.length === 0) {
      // nothing was written, so this is an ordinary failed import
      return error;
    }

    Logging.warn(
      "Import failed after part of the records had been saved",
      {
        importedCount: savedEntities.length,
        totalCount: entitiesToImport.length,
        entityType: settings.entityType,
      },
      error,
    );

    let completedImport: ImportMetadata;
    try {
      completedImport = await this.saveImportHistory(savedEntities, settings);
    } catch (historyError) {
      Logging.warn(
        "Import history could not be saved for a partial import",
        { entityType: settings.entityType },
        historyError,
      );
    }

    return new PartialImportError(
      savedEntities.length,
      entitiesToImport.length,
      completedImport,
      error,
    );
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
