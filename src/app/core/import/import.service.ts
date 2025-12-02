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
