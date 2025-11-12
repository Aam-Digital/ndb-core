import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../entity/model/entity";
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
    const importProcessingContext = new ImportProcessingContext();
    for (const row of rawData) {
      importProcessingContext.row = row;
      importProcessingContext.rowIndex++;

      let entity = new entityConstructor();

      let hasMappedProperty = false; // to avoid empty records being created
      for (const col in row) {
        const mapping: ColumnMapping = importSettings.columnMapping.find(
          (c) => c.column === col,
        );
        if (!mapping) {
          continue;
        }

        const val = row[col];
        const hasSourceValue = val !== undefined && val !== null && val !== "";

        const parsed = await this.parseCell(
          val,
          mapping,
          entity,
          importProcessingContext,
        );

        if (parsed !== undefined) {
          // For entity references with multiple column mappings to the same field,
          entity[mapping.propertyName] = parsed;
          hasMappedProperty = true;
        } else if (hasSourceValue) {
          // Source had a value but parsing/matching failed; still count as mapped
          // ensures rows aren't skipped just because entity references don't match
          hasMappedProperty = true;
        }
      }

      if (hasMappedProperty) {
        mappedEntities.push(entity);
      }
    }

    return this.importExistingService.applyExistingEntitiesIfApplicable(
      mappedEntities,
      importSettings,
    );
  }

  private async parseCell(
    val: any,
    mapping: ColumnMapping,
    entity: Entity,
    importProcessingContext: any,
  ) {
    if (val === undefined || val === null) {
      return undefined;
    }

    const schema = entity.getSchema().get(mapping.propertyName);
    if (!schema) {
      return undefined;
    }

    let value = await this.schemaService
      .getDatatypeOrDefault(schema.dataType)
      .importMapFunction(
        val,
        schema,
        mapping.additional,
        importProcessingContext,
      );

    // ignore empty or invalid values for import
    if (!value && value !== 0 && value !== false) {
      // falsy values except 0 (=> null, undefined, empty string, NaN, ...)
      return undefined;
    }

    // enforcing array values to be correctly assigned
    value = schema.isArray && !Array.isArray(value) ? [value] : value;

    return value;
  }
}
