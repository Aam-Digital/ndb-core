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

  /**
   * If a matching existing entity is found, return that with the imported data applied to it.
   * @param importEntities The newly generated entity from the import data
   * @param importSettings
   */
  async applyExistingEntitiesIfApplicable(
    importEntities: Entity[],
    importSettings: ImportSettings,
  ): Promise<Entity[]> {
    const mappedFields = this.getMappedPropertyNames(
      importSettings.columnMapping,
    );
    const matchFields = this.getMatchingFields(importSettings, mappedFields);
    if (matchFields.length === 0) {
      return importEntities;
    }

    const existingEntities = await this.entityMapper.loadType(
      importSettings.entityType,
    );

    return importEntities.map((entity) =>
      this.applyToExistingEntityIfApplicable(
        entity,
        existingEntities,
        mappedFields,
        matchFields,
      ),
    );
  }

  private getMappedPropertyNames(
    columnMapping: ImportSettings["columnMapping"],
  ): string[] {
    return (columnMapping ?? [])
      .filter((m) => !!m.propertyName)
      .map((m) => m.propertyName);
  }

  private getMatchingFields(
    importSettings: ImportSettings,
    mappedFields: string[],
  ): string[] {
    if (!importSettings.matchExistingByFields || mappedFields.length === 0) {
      return [];
    }

    return importSettings.matchExistingByFields.filter((field) =>
      mappedFields.includes(field),
    );
  }

  private applyToExistingEntityIfApplicable(
    importEntity: Entity,
    existingEntities: Entity[],
    mappedFields: string[],
    matchFields: string[],
  ): Entity {
    const existingEntity = this.findExistingEntity(
      importEntity,
      existingEntities,
      matchFields,
    );

    if (!existingEntity) {
      return importEntity;
    }

    const importUndo = this.buildImportUndo(
      existingEntity,
      importEntity,
      mappedFields,
    );
    this.applyImportedValues(existingEntity, importEntity, mappedFields);
    existingEntity["_importUndo"] = importUndo;
    return existingEntity;
  }

  private buildImportUndo(
    existingEntity: Entity,
    importEntity: Entity,
    mappedFields: string[],
  ): ImportDataChange {
    const undo: ImportDataChange = {};
    for (const key of mappedFields) {
      const schemaField = existingEntity.getSchema().get(key);
      undo[key] = {
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
    return undo;
  }

  private applyImportedValues(
    existingEntity: Entity,
    importEntity: Entity,
    mappedFields: string[],
  ): void {
    for (const key of mappedFields) {
      existingEntity[key] = importEntity[key];
    }
  }

  private findExistingEntity(
    importEntity: Entity,
    existingEntities: Entity[],
    matchFields: string[],
  ): Entity | undefined {
    const rawImportEntity =
      this.schemaService.transformEntityToDatabaseFormat(importEntity);

    return existingEntities.find((e) =>
      this.entityMatchesImport(e, rawImportEntity, matchFields),
    );
  }

  private entityMatchesImport(
    existingEntity: Entity,
    rawImportEntity: any,
    matchFields: string[],
  ): boolean {
    let hasAtLeastOneNonEmptyMatch = false;

    const allFieldsMatch = matchFields.every((field) => {
      const schemaField = existingEntity.getSchema().get(field);
      const rawExistingValue = this.schemaService.valueToDatabaseFormat(
        existingEntity[field],
        schemaField,
      );
      const rawImportValue = rawImportEntity[field];

      const comparison = this.compareFieldValues(
        rawExistingValue,
        rawImportValue,
      );

      if (comparison === "match") {
        hasAtLeastOneNonEmptyMatch = true;
      }
      return comparison !== "no-match";
    });

    return allFieldsMatch && hasAtLeastOneNonEmptyMatch;
  }

  private compareFieldValues(
    existingValue: any,
    importValue: any,
  ): "match" | "no-match" | "skip" {
    const existingIsEmpty = this.isEmptyImportValue(existingValue);
    const importIsEmpty = this.isEmptyImportValue(importValue);

    // If both values are empty, ignore this field for matching
    if (existingIsEmpty && importIsEmpty) {
      return "skip";
    }

    // If only one value is empty, don't match
    if (existingIsEmpty || importIsEmpty) {
      return "no-match";
    }

    // Compare the "database formats" (to match complex values like dates)
    return existingValue === importValue ? "match" : "no-match";
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

  private isEmptyImportValue(value: any): boolean {
    return value === null || value === undefined || value === "";
  }
}
