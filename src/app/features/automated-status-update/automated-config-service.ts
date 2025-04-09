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
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { lastValueFrom } from "rxjs";

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedConfigService {
  private dependencyMap = new Map<
    string,
    {
      targetEntityType: EntityConstructor;
      targetFieldId: string;
      rule: any;
    }[]
  >();

  dependentEntity: { [entityType: string]: Set<string> } = {};

  constructor(
    private entityRegistry: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityRelationshipService: EntityRelationsService,
    private dialog: MatDialog,
    private configurableEnumService: ConfigurableEnumService,
  ) {
    this.buildDependencyMap();
  }

  /**
   * Precomputes dependency relationships during service initialization
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

  public async applyRulesToDependentEntities(entity: Entity): Promise<void> {
    const entityType = entity.getType();
    this.dependentEntity = {};

    // Load all entities linked to the modified entity
    const linkedEntities =
      await this.entityRelationshipService.loadAllLinkingToEntity(entity);
    const dependentTypeMap = new Map<string, Set<string>>();

    linkedEntities.forEach((relatedEntity) => {
      Object.entries(relatedEntity.entity).forEach(([key, value]) => {
        if (typeof value === "string" && value.includes(":")) {
          const [type, id] = value.split(":");
          if (!dependentTypeMap.has(type)) {
            dependentTypeMap.set(type, new Set());
          }
          dependentTypeMap.get(type).add(`${type}:${id}`);
        }
      });
    });

    dependentTypeMap.forEach((ids, type) => {
      this.dependentEntity[type] = new Set([
        ...(this.dependentEntity[type] || []),
        ...ids,
      ]);
    });

    await this.applyFieldValueMappings(entity, entityType);
  }

  /**
   * Retrieves precomputed dependencies for a given entity field
   * @returns Array of dependency configurations
   */
  public findEntitiesDependingOnField(
    sourceEntityType: string,
    changedField: string,
  ) {
    return this.dependencyMap.get(`${sourceEntityType}|${changedField}`) || [];
  }

  /**
   * Applies configured field value mappings to dependent entities
   * @param entity - Source entity that was modified
   * @param entityType - Type of the source entity
   */
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

        // Skip if no entities of this type need updates
        if (!dependentIds?.size) continue;

        const targetField = dependent.targetFieldId;
        const mapping = dependent.rule.automatedMapping;
        const valueMap = new Map(
          Object.entries(mapping).map(([k, v]) => [v, k]),
        );
        const newValue = valueMap.get(changedValue.id);

        const entitiesToLoad = Array.from(dependentIds).map((id) => {
          const [_, entityId] = id.split(":");
          return this.entityMapper.load(dependent.targetEntityType, entityId);
        });
        const loadedEntities = await Promise.all(entitiesToLoad);

        // Process each loaded entity for automated updates
        for (const targetEntity of loadedEntities) {
          const fieldConfig =
            dependent.targetEntityType.schema.get(targetField);
          let enumValueObj = newValue ?? targetEntity[targetField];

          if (fieldConfig?.additional) {
            const enumEntity = this.configurableEnumService.getEnum(
              fieldConfig.additional,
            );
            enumValueObj = enumEntity?.values?.find(
              (v) => v.id === enumValueObj,
            );
          }
          // Only track entities that actually need updates
          if (targetEntity[targetField] !== newValue) {
            targetEntity[targetField] = newValue;
            affectedEntities.push({
              id: targetEntity.getId(),
              name:
                targetEntity["name"] ??
                `${dependentType} ${targetEntity.getId()}`,
              newStatus: enumValueObj,
              targetField,
              targetEntityType: dependent.targetEntityType,
              selectedField: { ...fieldConfig, id: targetField },
              affectedEntity: targetEntity,
            });
          }
        }
      }
    }

    if (affectedEntities.length > 0) {
      const userConfirmedUpdates =
        await this.showConfirmationDialog(affectedEntities);

      if (userConfirmedUpdates) {
        const saveOperations = userConfirmedUpdates.map(async (update) => {
          const entity = await this.entityMapper.load(
            update.targetEntityType,
            update.id,
          );
          entity[update.targetField] = update.newStatus;
          return this.entityMapper.save(entity);
        });

        await Promise.all(saveOperations);
      }
    }
  }

  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
  ): Promise<AffectedEntity[] | null> {
    const dialogRef = this.dialog.open(AutomatedUpdateDialogComponent, {
      maxHeight: "90vh",
      data: { entities: entitiesToUpdate },
    });

    return await lastValueFrom(dialogRef.afterClosed());
  }
}
