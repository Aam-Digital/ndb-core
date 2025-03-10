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
   * @param entityType
   * @param columnMapping
   */
  async transformRawDataToEntities(
    rawData: any[],
    entityType: string,
    columnMapping: ColumnMapping[],
  ): Promise<Entity[]> {
    if (!rawData || !entityType || !columnMapping) {
      return [];
    }

    const entityConstructor = this.entityTypes.get(entityType);

    const mappedEntities: Entity[] = [];
    for (const row of rawData) {
      const entity = new entityConstructor();
      let hasMappedProperty = false;

      for (const col in row) {
        const mapping: ColumnMapping = columnMapping.find(
          (c) => c.column === col,
        );
        if (!mapping) {
          continue;
        }

        const parsed = await this.parseRow(row[col], mapping, entity);
        if (parsed === undefined) {
          continue;
        }

        // ignoring falsy values except 0 (=> null, undefined, empty string)
        if (!!parsed || parsed === 0) {
          // enforcing array values to be correctly assigned
          entity[mapping.propertyName] =
            entityConstructor.schema.get(mapping.propertyName)?.isArray &&
            !Array.isArray(parsed)
              ? [parsed]
              : parsed;
          hasMappedProperty = true;
        }
      }
      if (hasMappedProperty) {
        mappedEntities.push(entity);
      }
    }

    return mappedEntities;
  }

  private parseRow(val: any, mapping: ColumnMapping, entity: Entity) {
    if (val === undefined || val === null) {
      return undefined;
    }

    const schema = entity.getSchema().get(mapping.propertyName);
    if (!schema) {
      return undefined;
    }

    return this.schemaService
      .getDatatypeOrDefault(schema.dataType)
      .importMapFunction(val, schema, mapping.additional);
  }
}
