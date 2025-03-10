import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { ImportAdditionalService } from "./additional-actions/import-additional/import-additional.service";

/**
 * Supporting import of data from spreadsheets.
 */
@Injectable({
  providedIn: "root",
})
export class ImportService {
  constructor(
    private entityMapper: EntityMapperService,
    private entityTypes: EntityRegistry,
    private schemaService: EntitySchemaService,
    private importAdditionalService: ImportAdditionalService,
  ) {}

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
    importMeta.ids = savedEntities.map((entity) => entity.getId());
    await this.entityMapper.save(importMeta);
    return importMeta;
  }

  undoImport(item: ImportMetadata) {
    const removes = item.ids.map((id) =>
      this.entityMapper
        .load(item.config.entityType, id)
        .then((e) => this.entityMapper.remove(e))
        .catch(() => undefined),
    );

    const undoAdditional = this.importAdditionalService.undoImport(item);

    // Or should the ImportMetadata still be kept indicating that it has been undone?
    return Promise.all([
      ...removes,
      undoAdditional,
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
    for (const row of rawData) {
      let entity = new entityConstructor();

      let hasMappedProperty = false; // to avoid empty records being created
      for (const col in row) {
        const mapping: ColumnMapping = importSettings.columnMapping.find(
          (c) => c.column === col,
        );
        if (!mapping) {
          continue;
        }

        const parsed = await this.parseRow(row[col], mapping, entity);
        if (parsed === undefined) {
          continue;
        }

        entity[mapping.propertyName] = parsed;
        hasMappedProperty = true;
      }

      if (hasMappedProperty) {
        entity = await this.applyToExistingEntityIfApplicable(
          entity,
          importSettings,
        );
        mappedEntities.push(entity);
      }
    }

    delete this.existingEntitiesCache;
    return mappedEntities;
  }

  /**
   * If a matching existing entity is found, return that with the imported data applied to it.
   * @param importEntity The newly generated entity from the import data
   * @param importSettings
   * @private
   */
  private async applyToExistingEntityIfApplicable(
    importEntity: Entity,
    importSettings: ImportSettings,
  ): Promise<Entity> {
    if (!importSettings.idFields || importSettings.idFields.length === 0)
      return importEntity;

    if (!this.existingEntitiesCache) {
      this.existingEntitiesCache = await this.entityMapper.loadType(
        importSettings.entityType,
      );
    }

    const rawImportEntity =
      this.schemaService.transformEntityToDatabaseFormat(importEntity);

    const existingEntity = this.existingEntitiesCache.find((e) =>
      importSettings.idFields.every((idField) => {
        const schemaField = e.getSchema().get(idField);
        const rawExistingValue = this.schemaService.valueToDatabaseFormat(
          e[idField],
          schemaField,
        );

        return (
          // compare the "database formats" (to match complex values like dates)
          rawExistingValue === rawImportEntity[idField] ||
          // allow partial match if a column is not part of the import:
          !importEntity.hasOwnProperty(idField) ||
          !e.hasOwnProperty(idField)
        );
      }),
    );

    if (existingEntity) {
      for (const key of importSettings.columnMapping.map(
        (m) => m.propertyName,
      )) {
        // apply only properties from the import
        existingEntity[key] = importEntity[key];
      }
    }

    return existingEntity ?? importEntity;
  }

  private existingEntitiesCache: Entity[];

  private async parseRow(val: any, mapping: ColumnMapping, entity: Entity) {
    if (val === undefined || val === null) {
      return undefined;
    }

    const schema = entity.getSchema().get(mapping.propertyName);
    if (!schema) {
      return undefined;
    }

    let value = await this.schemaService
      .getDatatypeOrDefault(schema.dataType)
      .importMapFunction(val, schema, mapping.additional);

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
