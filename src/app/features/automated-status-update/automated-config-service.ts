import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";

@Injectable({ providedIn: "root" })
export class AutomatedConfigService {
  constructor(
    private entityRegistry: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityRelationshipService: EntityRelationsService,
  ) {}
  dependentIdsMap: { [key: string]: Set<string> } = {};

  /**
   * Returns all entity types and field configs that depend on the given entity type + field.
   * e.g., Child.gender depends on School.language
   */
  public findEntitiesDependingOnField(
    entityType: string,
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
              rule.relatedEntity === entityType &&
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

  public async applyRulesToDependents(entity: Entity): Promise<void> {
    const type = entity.getType();
    const schema = entity.getSchema();

    this.dependentIdsMap = {};

    for (const [changedField] of schema.entries()) {
      const dependents = this.findEntitiesDependingOnField(type, changedField);

      for (const dependent of dependents) {
        const dependentType = dependent.targetEntityType.ENTITY_TYPE;
        const relatedEntities =
          await this.entityRelationshipService.loadAllLinkingToEntity(entity);

        for (const relatedEntity of relatedEntities) {
          let idToUse: string | undefined;

          // Find the ID in the format "Entity:id"
          for (const [key, value] of Object.entries(relatedEntity.entity)) {
            if (
              typeof value === "string" &&
              value.startsWith(`${dependentType}:`)
            ) {
              idToUse = value;
              break;
            }
          }

          if (idToUse) {
            if (!this.dependentIdsMap[dependentType]) {
              this.dependentIdsMap[dependentType] = new Set();
            }
            this.dependentIdsMap[dependentType].add(idToUse);
          }
        }
      }
    }

    for (const [changedField, changedValue] of Object.entries(entity)) {
      const dependents = this.findEntitiesDependingOnField(type, changedField);

      for (const dependent of dependents) {
        const dependentType = dependent.targetEntityType.ENTITY_TYPE;
        const dependentIds = this.dependentIdsMap[dependentType];

        if (!dependentIds) continue;

        const targetField = dependent.targetFieldId;
        const mapping = dependent.rule.automatedMapping;

        let newValue: string;

        if (changedValue in mapping) {
          newValue = mapping[changedValue];
        } else if ("" in mapping) {
          newValue = mapping[""];
        } else {
          continue;
        }

        for (const entityId of Array.from(dependentIds)) {
          try {
            const [_, id] = entityId.split(":");
            const childEntity = await this.entityMapper.load(
              dependent.targetEntityType,
              id,
            );

            if (childEntity[targetField] !== newValue) {
              childEntity[targetField] = newValue;
              console.log(childEntity, "childEntity");
              //   await this.entityMapper.save(childEntity);
              console.log(
                `updated ${dependentType} ${id}: ${targetField}=${newValue}`,
              );
            }
          } catch (error) {
            console.error(`Failed to update ${entityId}:`, error);
          }
        }
      }
    }
  }
}
