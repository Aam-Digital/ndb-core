import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AutomatedStatusUpdateComponent,
} from "./automated-status-update.component";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { lastValueFrom } from "rxjs";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedStatusUpdateConfigService {
  affectedEntities: AffectedEntity[] = [];
  relatedEntities: Entity[] = [];
  mappedPropertyConfig: EntitySchemaField;
  dependentEntity: { [entityType: string]: Set<string> } = {};

  constructor(
    private entityRegistry: EntityRegistry,
    private entityMapper: EntityMapperService,
    private dialog: MatDialog,
    private configurableEnumService: ConfigurableEnumService,
    private entitySchemaService: EntitySchemaService,
  ) {
    this.buildDependencyMap();
  }

  /**
   * Builds a map of dependent field rules from entity schema config
   * to be used during automatic updates.
   */
  private buildDependencyMap() {
    for (const targetType of this.entityRegistry.values()) {
      for (const [fieldKey, fieldConfig] of targetType.schema.entries()) {
        const rules = fieldConfig.defaultValue?.automatedConfigRule;
        if (fieldConfig.defaultValue?.mode === "AutomatedConfigRule" && rules) {
          for (const rule of rules) {
            const key = `${rule.relatedEntity}|${rule.relatedField}`;
            const entry = {
              targetEntityType: targetType,
              targetFieldId: fieldKey,
              mappedProperty: rule.mappedProperty,
              rule,
            };
            this.dependencyMap.set(key, [
              ...(this.dependencyMap.get(key) || []),
              entry,
            ]);
          }
        }
      }
    }
  }

  private dependencyMap = new Map<
    string,
    {
      targetEntityType: EntityConstructor;
      targetFieldId: string;
      mappedProperty: string;
      rule: any;
    }[]
  >();

  /**
   * Retrieves all automated rules for a given source entity field.
   * @param sourceEntityType - The entity type of the source
   * @param changedField - The changed field in the source entity
   */
  public findEntitiesDependingOnField(
    sourceEntityType: string,
    changedField: string,
  ) {
    return this.dependencyMap.get(`${sourceEntityType}|${changedField}`) || [];
  }

  /**
   * Applies rules to dependent entities based on changes in the provided entity.
   * Also prompts user confirmation and saves updates if any changes were made.
   * @param entity - The source entity whose changes should trigger updates
   */
  public async applyRulesToDependentEntities(
    entity: Entity,
    changedFields: any,
  ): Promise<void> {
    this.affectedEntities = []; // Clear previous entries
    const changedEntries = Object.entries(changedFields);
    await this.applyFieldMappings(changedEntries, entity);

    if (this.affectedEntities.length > 0) {
      await this.confirmAndSaveAffectedEntities();
    }
  }

  /**
   * Iterates through all changed fields in the source entity
   * and applies mapping rules to each relevant dependent entity.
   * @param changedFields - List of changed fields and their values
   * @param entity - The full source entity
   */
  private async applyFieldMappings(
    changedFields: [string, any][],
    entity: Entity,
  ): Promise<void> {
    for (const [changedField, changedValue] of changedFields) {
      const affectedRecords = this.findEntitiesDependingOnField(
        entity.getType(),
        changedField,
      );
      for (const affected of affectedRecords) {
        if (changedField == affected.rule.relatedField) {
          await this.applyMappingToAffectedRecord(
            entity,
            affected,
            changedValue,
          );
        }
      }
    }
  }

  /**
   * Applies the field mapping rule to each related entity based on one affected record.
   * @param sourceEntity - The entity where the change occurred
   * @param affected - Configuration for the affected entity and field
   * @param changedValue - The new value of the changed field
   */
  private async applyMappingToAffectedRecord(
    sourceEntity: Entity,
    affected: any,
    changedValue: any,
  ): Promise<void> {
    const entity = sourceEntity[affected.mappedProperty];
    this.mappedPropertyConfig = sourceEntity
      .getSchema()
      .get(affected.mappedProperty);
    if (!entity) return;
    const newValue = this.getMappedValue(
      affected.rule.automatedMapping,
      changedValue,
    );
    const loadedEntities = await this.loadRelatedEntities(
      entity,
      affected.targetEntityType,
    );

    for (const targetEntity of loadedEntities) {
      await this.updateTargetEntityField(targetEntity, affected, newValue);
    }
  }

  /**
   * Extracts the value to be applied to target entities.
   * @param mapping - Mapping config from rule
   * @param changedValue - The new value of the source field
   */
  private getMappedValue(
    mapping: Record<string, string>,
    changedValue: any,
  ): any {
    return mapping[changedValue.id];
  }

  /**
   * Loads entities by ID using the entity mapper.
   * @param entityids - List of entity entityiDs to load
   * @param type - The constructor/type of the entities
   */
  private async loadRelatedEntities(
    entityids: string[],
    entityType: string,
  ): Promise<Entity[]> {
    const loadEntities = entityids.map((id) =>
      this.entityMapper.load(entityType, id),
    );
    this.relatedEntities = await Promise.all(loadEntities);
    return this.relatedEntities;
  }

  /**
   * Updates the target field in a dependent entity and tracks the change
   * for later confirmation and saving.
   * @param targetEntity - The entity to be updated
   * @param affected - Config defining which field to update
   * @param newValue - The new value to assign to the field
   */
  private async updateTargetEntityField(
    targetEntity: Entity,
    affected: any,
    newValue: any,
  ): Promise<void> {
    const targetField = affected.targetFieldId;
    const fieldConfig = affected.targetEntityType.schema.get(targetField);
    let dropdownValues = newValue ?? targetEntity[targetField];
    if (fieldConfig?.additional) {
      const enumEntity = this.configurableEnumService.getEnum(
        fieldConfig.additional,
      );
      dropdownValues = enumEntity?.values?.find((v) => v.id === dropdownValues);
    }

    if (targetEntity[targetField] !== newValue) {
      targetEntity[targetField] = newValue;
      this.affectedEntities.push({
        id: targetEntity.getId(),
        newStatus: dropdownValues,
        targetField,
        targetEntityType: affected.targetEntityType,
        selectedField: { ...fieldConfig, id: targetField },
        affectedEntity: targetEntity,
        mappedProperty: this.mappedPropertyConfig.label,
      });
    }
  }

  /**
   * Opens a dialog to confirm entity updates with the user.
   * Saves entities only if the user confirms the changes.
   */
  private async confirmAndSaveAffectedEntities(): Promise<void> {
    const userConfirmed = await this.showConfirmationDialog(
      this.affectedEntities,
    );
    if (!userConfirmed) return;

    const updatedRelatedEntity = userConfirmed.map(async (update) => {
      const entity = this.relatedEntities.find((e) => e.getId() == update.id);
      entity[update.targetField] = update.newStatus;
      return this.entityMapper.save(entity);
    });

    await Promise.all(updatedRelatedEntity);
  }

  /**
   * Opens the confirmation dialog to let user to approve or update the changes.
   * @param entitiesToUpdate - List of entities with pending updates
   */
  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
  ): Promise<AffectedEntity[] | null> {
    const dialogRef = this.dialog.open(AutomatedStatusUpdateComponent, {
      maxHeight: "90vh",
      data: { entities: entitiesToUpdate },
    });

    return await lastValueFrom(dialogRef.afterClosed());
  }
}
