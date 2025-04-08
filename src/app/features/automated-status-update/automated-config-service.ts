import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AutomatedUpdateDialogComponent,
} from "./automated-status-update.component";

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedConfigService {
  constructor(
    private entityRegistry: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityRelationshipService: EntityRelationsService,
    private dialog: MatDialog,
  ) {}

  dependentEntity: { [entityType: string]: Set<string> } = {};

  /**
   * Applies rules for any dependent entity types when a given entity is updated.
   * Finds dependent fields and updates them according to the configured rule mappings.
   */
  public async applyRulesToDependentEntities(entity: Entity): Promise<void> {
    const entityType = entity.getType();
    const entitySchema = entity.getSchema();

    this.dependentEntity = {};

    // Identify dependent entity types for all fields in the updated entity
    for (const [changedField] of entitySchema.entries()) {
      const dependents = this.findEntitiesDependingOnField(
        entityType,
        changedField,
      );

      for (const dependent of dependents) {
        const dependentType = dependent.targetEntityType.ENTITY_TYPE;
        const linkedEntities =
          await this.entityRelationshipService.loadAllLinkingToEntity(entity);

        for (const relatedEntity of linkedEntities) {
          let relatedEntityId: string | undefined;

          // Find the ID of the linked entity that matches the target type
          for (const [key, value] of Object.entries(relatedEntity.entity)) {
            if (
              typeof value === "string" &&
              value.startsWith(`${dependentType}:`)
            ) {
              relatedEntityId = value;
              break;
            }
          }

          if (relatedEntityId) {
            if (!this.dependentEntity[dependentType]) {
              this.dependentEntity[dependentType] = new Set();
            }
            this.dependentEntity[dependentType].add(relatedEntityId);
          }
        }
      }
    }

    await this.applyFieldValueMappings(entity, entityType);
  }

  /**
   * Finds all entity types and fields that are configured to depend on a specific entityType and field.
   * These are declared via the `AutomatedConfigRule` in the schema's defaultValue.
   */
  public findEntitiesDependingOnField(
    sourceEntityType: string,
    changedField: string,
  ): {
    targetEntityType: EntityConstructor;
    targetFieldId: string;
    rule: any;
  }[] {
    const dependents = [];

    for (const targetType of this.entityRegistry.values()) {
      for (const [fieldKey, fieldConfig] of targetType.schema.entries()) {
        const defaultVal = fieldConfig.defaultValue;

        if (
          defaultVal?.mode === "AutomatedConfigRule" &&
          Array.isArray(defaultVal.automatedConfigRule)
        ) {
          for (const rule of defaultVal.automatedConfigRule) {
            if (
              rule.relatedEntity === sourceEntityType &&
              rule.relatedField === changedField
            ) {
              dependents.push({
                targetEntityType: targetType,
                targetFieldId: fieldKey,
                rule,
              });
            }
          }
        }
      }
    }
    return dependents;
  }

  private async applyFieldValueMappings(
    entity: Entity,
    entityType: string,
  ): Promise<void> {
    const affectedEntities: AffectedEntity[] = [];
    for (const [changedField, changedValue] of Object.entries(entity)) {
      const dependents = this.findEntitiesDependingOnField(
        entityType,
        changedField,
      );

      for (const dependent of dependents) {
        const dependentType = dependent.targetEntityType.ENTITY_TYPE;
        const dependentIds = this.dependentEntity[dependentType];

        if (!dependentIds) continue;

        const targetField = dependent.targetFieldId;
        const mapping = dependent.rule.automatedMapping;
        const allStatuses = Object.keys(mapping);
        let newValue: string | undefined;

        for (const [key, value] of Object.entries(mapping)) {
          if (value === changedValue.id) {
            newValue = key;
            break;
          }
        }

        for (const entityId of Array.from(dependentIds)) {
          const [_, id] = entityId.split(":");
          const targetEntity = await this.entityMapper.load(
            dependent.targetEntityType,
            id,
          );

          if (targetEntity[targetField] !== newValue) {
            targetEntity[targetField] = newValue;
            affectedEntities.push({
              id,
              name: targetEntity["name"] ?? `${dependentType} ${id}`,
              currentStatus: targetEntity[targetField],
              newStatus: newValue ?? targetEntity[targetField],
              allStatuses,
              targetField,
              targetEntityType: dependent.targetEntityType,
            });
          }
        }
      }
    }
    if (affectedEntities.length > 0) {
      const userConfirmedUpdates =
        await this.showConfirmationDialog(affectedEntities);

      if (userConfirmedUpdates) {
        for (const update of userConfirmedUpdates) {
          // const entity = await this.entityMapper.load(update.targetEntityType, update.id);
          // entity[update.targetField] = update.newStatus;
          // await this.entityMapper.save(entity);
          console.log(`Updated ${update.name} to status: ${update.newStatus}`);
        }
      }
    }
  }

  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
  ): Promise<AffectedEntity[] | null> {
    const dialogRef = this.dialog.open(AutomatedUpdateDialogComponent, {
      width: "600px",
      data: { entities: entitiesToUpdate },
    });

    return dialogRef.afterClosed().toPromise();
  }
}
