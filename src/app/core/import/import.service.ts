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
import { PartialBulkWriteError } from "../database/database";

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
 * The records that were stored although the save as a whole was rejected.
 *
 * A rejected save reports what became of the records (see `Database.putAll`): the
 * results array when individual records failed, a {@link PartialBulkWriteError} when
 * the write stopped partway. Any other rejection means nothing was stored.
 */
function storedRecordsOf(records: Entity[], error: unknown): Entity[] {
  let results: any[];
  if (Array.isArray(error)) {
    results = error;
  } else if (error instanceof PartialBulkWriteError) {
    results = error.storedResults;
  } else {
    return [];
  }

  const storedIds = new Set(
    results.filter((result) => result?.ok).map((result) => result.id),
  );
  return records.filter((entity) => storedIds.has(entity.getId()));
}

/**
 * A short description of why a save failed, safe to pass on to a log or a message.
 *
 * A rejected save reports what happened to each individual document (see
 * `Database.putAll`), i.e. potentially thousands of document ids - which have no place
 * in remote monitoring (see #4174) or in a message shown to the user.
 */
export function describeSaveFailure(error: unknown): unknown {
  if (error instanceof PartialBulkWriteError) {
    return describeSaveFailure(error.cause);
  }

  if (Array.isArray(error)) {
    const failed = error.filter((result) => !result?.ok);
    return {
      failedDocuments: failed.length,
      statuses: [
        ...new Set(failed.map((result) => result?.status ?? result?.name)),
      ],
    };
  }

  return error;
}

/**
 * The step of an import that failed although records had already been saved.
 *
 * "records": the write of the imported records itself stopped partway.
 * "links": all records were written and one of the additional link actions failed.
 */
export type ImportFailureStage = "records" | "links";

/**
 * Thrown when an import failed after part of its records had already been saved.
 *
 * A failed import used to mean that nothing was written, so retrying the file was
 * always safe. Since a large import is written in several requests that no longer
 * holds, and the user has to be told what did get imported - otherwise they re-run
 * the whole file and duplicate it.
 */
export class PartialImportError extends Error {
  constructor(
    /** which step of the import failed (the saved records differ accordingly) */
    readonly stage: ImportFailureStage,
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

  async executeImport(
    entitiesToImport: Entity[],
    settings: ImportSettings,
  ): Promise<ImportMetadata> {
    try {
      await this.entityMapper.saveAll(entitiesToImport);
    } catch (error) {
      throw await this.reportPartialImport(
        "records",
        storedRecordsOf(entitiesToImport, error),
        entitiesToImport,
        settings,
        error,
      );
    }

    try {
      await this.importAdditionalService.executeImport(
        entitiesToImport,
        settings,
      );
    } catch (error) {
      // the records themselves are all stored by now, whatever the additional
      // actions failed at - so this is a partial import, not a failed one, and must
      // be recorded as such instead of letting the user re-run the whole file.
      // The error itself concerns the relationship records, so unlike above the
      // saved records cannot be read off it.
      throw await this.reportPartialImport(
        "links",
        entitiesToImport,
        entitiesToImport,
        settings,
        error,
      );
    }

    return this.saveImportHistory(entitiesToImport, settings);
  }

  /**
   * Record the records that were stored before the save failed and return the error
   * to report for it.
   *
   * The database writes a large import in several requests, so a failure can leave
   * part of the records stored - and anything failing after that write leaves all of
   * them stored. A partial import that no history entry mentions could neither be
   * recognised nor undone, leaving the user to find those records one by one - so it
   * is recorded here before the failure is passed on.
   */
  private async reportPartialImport(
    stage: ImportFailureStage,
    savedEntities: Entity[],
    entitiesToImport: Entity[],
    settings: ImportSettings,
    error: unknown,
  ): Promise<unknown> {
    if (savedEntities.length === 0) {
      // nothing was stored, so this is an ordinary failed import
      return error;
    }

    Logging.warn("Import failed after part of the records had been saved", {
      stage,
      importedCount: savedEntities.length,
      totalCount: entitiesToImport.length,
      entityType: settings.entityType,
      reason: describeSaveFailure(error),
    });

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
      stage,
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
