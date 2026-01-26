import { inject, Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import {
  ImportDataChange,
  ImportMetadata,
  ImportSettings,
} from "../import-metadata";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

/**
 * Import data to update existing records
 * (extending the basic `ImportService`)
 */
@Injectable({
  providedIn: "root",
})
export class ImportExistingService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly schemaService = inject(EntitySchemaService);

  private existingEntitiesCache: Entity[];

  /**
   * If a matching existing entity is found, return that with the imported data applied to it.
   * @param importEntities The newly generated entity from the import data
   * @param importSettings
   */
  async applyExistingEntitiesIfApplicable(
    importEntities: Entity[],
    importSettings: ImportSettings,
  ): Promise<Entity[]> {
    const updatedEntities = [];
    for (const entity of importEntities) {
      const updatedEntity = await this.applyToExistingEntityIfApplicable(
        entity,
        importSettings,
      );
      updatedEntities.push(updatedEntity);
    }

    delete this.existingEntitiesCache;
    return updatedEntities;
  }

  private async applyToExistingEntityIfApplicable(
    importEntity: Entity,
    importSettings: ImportSettings,
  ) {
    if (
      !importSettings.matchExistingByFields ||
      importSettings.matchExistingByFields.length === 0
    )
      return importEntity;

    if (!this.existingEntitiesCache) {
      this.existingEntitiesCache = await this.entityMapper.loadType(
        importSettings.entityType,
      );
    }

    const existingEntity = this.findExistingEntity(
      importSettings,
      importEntity,
    );

    if (existingEntity) {
      const importUndo: ImportDataChange = {};

      const importedFields = importSettings.columnMapping
        .filter((m) => !!m.propertyName)
        .map((m) => m.propertyName);
      for (const key of importedFields) {
        importUndo[key] = this.generateUndoInfoForField(
          existingEntity,
          key,
          importEntity,
        );

        // apply only properties from the import
        existingEntity[key] = importEntity[key];
      }

      existingEntity["_importUndo"] = importUndo;
    }

    return existingEntity ?? importEntity;
  }

  private findExistingEntity(
    importSettings: ImportSettings,
    importEntity: Entity,
  ) {
    // Determine which of the selected identifier fields are actually mapped, in the column mapping
    const mappedFields = (importSettings.columnMapping ?? [])
      .filter((m) => !!m.propertyName)
      .map((m) => m.propertyName);

    const mappedMatchFields = (
      importSettings.matchExistingByFields ?? []
    ).filter((f) => mappedFields.includes(f));

    if (mappedMatchFields.length === 0) return undefined;

    const rawImportEntity =
      this.schemaService.transformEntityToDatabaseFormat(importEntity);

    return this.existingEntitiesCache.find((e) => {
      let hasAtLeastOneNonEmptyMatch = false;

      const allFieldsMatch = mappedMatchFields.every((idField) => {
        const schemaField = e.getSchema().get(idField);
        const rawExistingValue = this.schemaService.valueToDatabaseFormat(
          e[idField],
          schemaField,
        );
        const rawImportValue = rawImportEntity[idField];

        const existingIsEmpty = this.isEmptyImportValue(rawExistingValue);
        const importIsEmpty = this.isEmptyImportValue(rawImportValue);

        // If both values are empty, ignore this field for matching
        if (existingIsEmpty && importIsEmpty) {
          return true;
        }

        // If only one value is empty, don't match
        if (existingIsEmpty || importIsEmpty) {
          return false;
        }

        // Compare the "database formats" (to match complex values like dates)
        const valuesMatch = rawExistingValue === rawImportValue;
        if (valuesMatch) {
          hasAtLeastOneNonEmptyMatch = true;
        }
        return valuesMatch;
      });

      // Require at least one non-empty field to actually match
      return allFieldsMatch && hasAtLeastOneNonEmptyMatch;
    });
  }

  private generateUndoInfoForField(
    existingEntity: Entity,
    key: string,
    importEntity: Entity,
  ) {
    const schemaField = existingEntity.getSchema().get(key);

    return {
      previousValue: this.schemaService.valueToDatabaseFormat(
        existingEntity[key],
        schemaField,
      ),
      importedValue: this.schemaService.valueToDatabaseFormat(
        importEntity[key],
        schemaField,
      ),
    };
  }

  getImportHistoryForUpdatedEntities(
    savedEntities: Entity[],
    settings: ImportSettings,
  ) {
    return savedEntities
      .filter((e) => e["_importUndo"])
      .map((e) => ({ id: e.getId(), importDataChanges: e["_importUndo"] }));
  }

  async undoImport(item: ImportMetadata) {
    const reverts = (item.updatedEntities ?? []).map(async (updated) => {
      const entity = await this.entityMapper.load(
        item.config.entityType,
        updated.id,
      );
      for (const [field, changes] of Object.entries(
        updated.importDataChanges,
      )) {
        const fieldSchema = entity.getSchema().get(field);
        if (
          this.schemaService.valueToDatabaseFormat(
            entity[field],
            fieldSchema,
          ) === changes.importedValue
        ) {
          // only revert back if the value has not been changed manually in the meantime
          entity[field] = this.schemaService.valueToEntityFormat(
            changes.previousValue,
            fieldSchema,
          );
        }
      }
      await this.entityMapper.save(entity);
    });

    await Promise.all(reverts);
  }

  isEmptyImportValue(value: any): boolean {
    return value === null || value === undefined || value === "";
  }
}
