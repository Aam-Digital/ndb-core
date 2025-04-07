import { Injectable } from "@angular/core";
import { equal } from "assert";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { asArray } from "app/utils/asArray";

@Injectable({ providedIn: "root" })
export class AutomatedConfigService {
  constructor(
    private entitySchemaService: EntitySchemaService,
    private entityRegistry: EntityRegistry,
    private entityMapper: EntityMapperService,
  ) {}

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

  /**
   * Called when an entity like School is saved, to check dependent entities
   */
  public async applyRulesToDependents(entity: Entity): Promise<void> {
    const type = entity.getType();
    const schema = entity.getSchema();

    for (const [changedField] of schema.entries()) {
      const dependents = this.findEntitiesDependingOnField(type, changedField);

      for (const dependent of dependents) {
        const relatedEntities = await this.entityMapper.loadType(
          dependent.targetEntityType,
        );
      }
    }
  }
}
