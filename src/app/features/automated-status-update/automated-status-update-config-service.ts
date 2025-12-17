import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AutomatedStatusUpdateComponent,
} from "./automated-status-update.component";
import { lastValueFrom } from "rxjs";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { DefaultValueConfigInheritedField } from "../inherited-field/inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedStatusUpdateConfigService {
  private entityRegistry = inject(EntityRegistry);
  private entityMapper = inject(EntityMapperService);
  private dialog = inject(MatDialog);
  private unsavedChangesService = inject(UnsavedChangesService);
  private entitySchemaService = inject(EntitySchemaService);

  /**
   * Track processed entity revisions to prevent duplicate automated status updates within the same save operation
   */
  private readonly processedRevisions = new Set<string>();

  /**
   * The relatedReferenceField configuration, which is used to show the label of related reference field in dialog.
   */
  relatedReferenceFieldConfig: EntitySchemaField;

  /**
   * Applies rules to dependent entities based on changes in the provided entity.
   * Also prompts user confirmation and saves updates if any changes were made.
   * @param entity - The source entity whose changes should trigger updates
   * @param entityBeforeChanges The state of the entity before changes were applied to identify what has changed
   */
  public async applyRulesToDependentEntities(
    entity: Entity,
    entityBeforeChanges: Entity,
  ): Promise<void> {
    if (this.checkRefAlreadyProcessed(entity)) return;

    // (1) get array of changed fields (we later need to compare if these are used as a sourceValueField)
    const changedFields = this.getChangedFields(entity, entityBeforeChanges);
    const changedFieldIds = changedFields.map((f) => f.fieldId);

    // (2.1) check schema fields of the entity if any automation rule uses the field as a sourceValueField
    // [NEW] (2.2) check schema fields of all other entity types, if any automation rule uses this sourceEntityType (= entity.getType()) and sourceValueField
    const relevantDirectRules: DefaultValueConfigInheritedField[] =
      this.getInheritanceRulesFromDirectEntity(entity.getConstructor()).filter(
        (r) => changedFieldIds.includes(r.sourceValueField),
      );
    const relevantIndirectRules: Array<{
      rule: DefaultValueConfigInheritedField;
      targetEntityType: EntityConstructor;
      targetFieldId: string;
    }> = this.getInheritanceRulesReferencingThisEntity(
      entity.getConstructor(),
    ).filter((r) => changedFieldIds.includes(r.rule.sourceValueField));

    // (3) load affected entities based on the rules from step 2
    // FOR EACH AFFECTED SCHEMA FIELD OF TARGET/CHILD ENTITY TYPE (i.e. from step 2)
    // (3.1) load affected entities where the sourceReferenceField is on this entity [current status automation]
    // [NEW] (3.2) load all entities of the affected type that could have a reference field in their own entity (e.g. a Child linking to this School currently getting saved)

    const affectedEntities: AffectedEntity[] = [
      ...(await this.loadAffectedDirectEntities(relevantDirectRules, entity)),
      ...(await this.loadAffectedIndirectEntities(
        relevantIndirectRules,
        entity,
      )),
    ];

    // (4) confirmAndSave all affectedEntities
    if (affectedEntities.length > 0) {
      await this.confirmAndSaveAffectedEntities(affectedEntities);
    }
  }

  /**
   * skip if already processed this specific entity revision
   * Note views can otherwise open multiple overlapping dialogs (because the note-details component contains three components, all sharing the same form instance)
   */
  private checkRefAlreadyProcessed(entity: Entity): boolean {
    const entityKey = `${entity.getId()}-${entity._rev}`;
    const alreadyProcessed = this.processedRevisions.has(entityKey);
    this.processedRevisions.add(entityKey);
    return alreadyProcessed;
  }

  /**
   * Find all Inheritance Rules on other entity types that list the given sourceEntityType.
   *
   * For example:
   * Given the method parameter sourceEntityType = School
   * Return any Rule in Child entity type, which refers to sourceEntityType = School
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesFromDirectEntity(
    sourceEntityType: EntityConstructor,
  ): DefaultValueConfigInheritedField[] {
    const rules: DefaultValueConfigInheritedField[] = [];

    for (const targetEntityType of this.entityRegistry.values()) {
      for (const [fieldId, fieldConfig] of targetEntityType.schema.entries()) {
        if (fieldConfig.defaultValue?.mode === "inherited-field") {
          const rule = fieldConfig.defaultValue
            .config as DefaultValueConfigInheritedField;

          if (rule?.sourceEntityType === sourceEntityType.ENTITY_TYPE) {
            rules.push(rule);
          }
        }
      }
    }

    return rules;
  }

  /**
   * Find all Inheritance Rules where the sourceReferenceField's entity type (in "additional") matches the given sourceEntityType.
   *
   * For example:
   * Given the method parameter sourceEntityType = School
   * Return any Rule in Child entity type, which has an undefined sourceEntityType
   *      and the sourceReferenceField (on the Child entity) has an "additional" = School dataType
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesReferencingThisEntity(
    sourceEntityType: EntityConstructor,
  ): Array<{
    rule: DefaultValueConfigInheritedField;
    targetEntityType: EntityConstructor;
    targetFieldId: string;
  }> {
    const rules: Array<{
      rule: DefaultValueConfigInheritedField;
      targetEntityType: EntityConstructor;
      targetFieldId: string;
    }> = [];

    for (const targetEntityType of this.entityRegistry.values()) {
      for (const [fieldId, fieldConfig] of targetEntityType.schema.entries()) {
        if (fieldConfig.defaultValue?.mode === "inherited-field") {
          const rule = fieldConfig.defaultValue
            .config as DefaultValueConfigInheritedField;

          // For inheritance rules: sourceEntityType is undefined
          if (!rule?.sourceEntityType && rule?.sourceReferenceField) {
            // Check if the sourceReferenceField could reference our entity type
            const referenceFieldConfig = targetEntityType.schema.get(
              rule.sourceReferenceField,
            );

            // If the reference field is configured to reference our entity type
            if (
              referenceFieldConfig?.dataType === "entity" &&
              referenceFieldConfig?.additional === sourceEntityType.ENTITY_TYPE
            ) {
              rules.push({
                rule,
                targetEntityType,
                targetFieldId: fieldId,
              });
            }
          }
        }
      }
    }

    return rules;
  }

  /**
   * Load affected entities for automation rules
   */
  private async loadAffectedDirectEntities(
    rules: DefaultValueConfigInheritedField[],
    sourceEntity: Entity,
  ): Promise<AffectedEntity[]> {
    const affectedEntities: AffectedEntity[] = [];

    for (const rule of rules) {
      const targetEntityType = this.findEntityTypeWithRule(rule);
      if (!targetEntityType) continue;

      const targetFieldId = this.findFieldIdWithRule(targetEntityType, rule);
      if (!targetFieldId) continue;

      // Get entities referenced by the source entity
      const referencedEntityIds = sourceEntity[rule.sourceReferenceField];
      if (!referencedEntityIds) continue;

      const targetEntities = await this.loadEntitiesByIds(
        targetEntityType,
        Array.isArray(referencedEntityIds)
          ? referencedEntityIds
          : [referencedEntityIds],
      );

      const processedEntities = this.processTargetEntities(
        targetEntities,
        rule,
        sourceEntity,
        targetEntityType,
        targetFieldId,
      );

      affectedEntities.push(...processedEntities);
    }

    return affectedEntities;
  }

  /**
   * Load affected entities for inheritance rules (indirect references)
   */
  private async loadAffectedIndirectEntities(
    ruleEntries: Array<{
      rule: DefaultValueConfigInheritedField;
      targetEntityType: EntityConstructor;
      targetFieldId: string;
    }>,
    sourceEntity: Entity,
  ): Promise<AffectedEntity[]> {
    const affectedEntities: AffectedEntity[] = [];

    for (const { rule, targetEntityType, targetFieldId } of ruleEntries) {
      // Load all entities of target type and filter for those referencing source entity
      const allTargetEntities =
        await this.entityMapper.loadType(targetEntityType);
      const targetEntities = allTargetEntities.filter(
        (entity) => entity[rule.sourceReferenceField] === sourceEntity.getId(),
      );

      const processedEntities = this.processTargetEntities(
        targetEntities,
        rule,
        sourceEntity,
        targetEntityType,
        targetFieldId,
      );

      affectedEntities.push(...processedEntities);
    }

    return affectedEntities;
  }

  /**
   * Common logic for processing target entities and creating AffectedEntity objects
   */
  private processTargetEntities(
    targetEntities: Entity[],
    rule: DefaultValueConfigInheritedField,
    sourceEntity: Entity,
    targetEntityType: EntityConstructor,
    targetFieldId: string,
  ): AffectedEntity[] {
    const affectedEntities: AffectedEntity[] = [];

    for (const targetEntity of targetEntities) {
      const newValue = this.calculateNewValue(sourceEntity, rule);

      if (targetEntity[targetFieldId] !== newValue) {
        const fieldConfig = targetEntityType.schema.get(targetFieldId);

        targetEntity[targetFieldId] = newValue;

        const formattedValue = this.entitySchemaService.valueToEntityFormat(
          newValue,
          fieldConfig,
        );

        affectedEntities.push({
          id: targetEntity.getId(),
          newStatus: formattedValue,
          targetFieldId,
          targetEntityType,
          selectedField: { ...fieldConfig, id: targetFieldId },
          affectedEntity: targetEntity,
          relatedReferenceField: rule.sourceReferenceField,
        });
      }
    }

    return affectedEntities;
  }

  /**
   * Calculate the new value from source entity with value mapping applied
   */
  private calculateNewValue(
    sourceEntity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): any {
    const sourceValue = sourceEntity[rule.sourceValueField];
    let newValue = sourceValue;

    if (rule.valueMapping && sourceValue) {
      const mappingKey = sourceValue.id;
      newValue = rule.valueMapping[mappingKey] || sourceValue;
    }

    return newValue;
  }

  /**
   * Find which entity type has a field configured with the given rule
   */
  private findEntityTypeWithRule(
    rule: DefaultValueConfigInheritedField,
  ): EntityConstructor | null {
    for (const entityType of this.entityRegistry.values()) {
      for (const [, fieldConfig] of entityType.schema.entries()) {
        if (
          fieldConfig.defaultValue?.mode === "inherited-field" &&
          fieldConfig.defaultValue.config === rule
        ) {
          return entityType;
        }
      }
    }
    return null;
  }

  /**
   * Find which field ID in the given entity type has the specified rule configured
   */
  private findFieldIdWithRule(
    entityType: EntityConstructor,
    rule: DefaultValueConfigInheritedField,
  ): string | null {
    for (const [fieldId, fieldConfig] of entityType.schema.entries()) {
      if (
        fieldConfig.defaultValue?.mode === "inherited-field" &&
        fieldConfig.defaultValue.config === rule
      ) {
        return fieldId;
      }
    }
    return null;
  }

  /**
   * Load entities by their IDs
   */
  private async loadEntitiesByIds(
    entityType: EntityConstructor,
    entityIds: string[],
  ): Promise<Entity[]> {
    const loadedEntities = await Promise.all(
      entityIds.map(async (id) => {
        try {
          const entity = await this.entityMapper.load(entityType, id);
          return entity;
        } catch (error) {
          Logging.warn(
            `AutomatedStatusUpdateConfigService: Failed to load entity of type ${entityType.ENTITY_TYPE} with ID ${id}: ${error}`,
          );
          return null;
        }
      }),
    );

    return loadedEntities.filter((entity) => entity);
  }

  /**
   * Analyze which fields changed during the current editing.
   * @param newEntity Updated entity after saving
   * @param originalEntity Entity before changes were applied
   * @return List of key-value pairs of all changed fields
   *         (field ID and new value in that field)
   * @private
   */
  private getChangedFields(
    newEntity: Entity,
    originalEntity: Entity,
  ): { fieldId: string; value: any }[] {
    const changedFields = [];

    for (const [key] of originalEntity.getSchema().entries()) {
      if (
        JSON.stringify(originalEntity[key]) !== JSON.stringify(newEntity[key])
      ) {
        changedFields.push({ fieldId: key, value: newEntity[key] });
      }
    }

    return changedFields;
  }

  /**
   * Opens a dialog to confirm entity updates with the user.
   * Saves entities only if the user confirms the changes.
   */
  private async confirmAndSaveAffectedEntities(
    affectedEntities: AffectedEntity[],
  ): Promise<void> {
    const userConfirmed = await this.showConfirmationDialog(affectedEntities);
    if (!userConfirmed) return;

    // Todo: Currently if there are multiple rule set for same entity and field, we are showing in UI as multiple entries,
    // we need a proper UI to show the same entity and field with multiple values
    const updatesByEntityId = new Map<string, AffectedEntity[]>();
    userConfirmed.forEach((update) => {
      const existing = updatesByEntityId.get(update.id) || [];
      existing.push(update);
      updatesByEntityId.set(update.id, existing);
    });

    const savePromises: Promise<any>[] = [];
    updatesByEntityId.forEach((updates, entityId) => {
      const entity = updates[0].affectedEntity;
      if (entity) {
        updates.forEach((update) => {
          entity[update.targetFieldId] = update.newStatus;
        });
        savePromises.push(this.entityMapper.save(entity));
      }
    });

    this.unsavedChangesService.pending = false;
    await Promise.all(savePromises);
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
