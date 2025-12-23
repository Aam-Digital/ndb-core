import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AutomatedFieldUpdateComponent,
} from "./automated-field-update.component";
import { lastValueFrom } from "rxjs";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { DefaultValueConfigInheritedField } from "../inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Represents a rule with its associated entity type and field information
 */
interface AffectedRule {
  rule: DefaultValueConfigInheritedField;
  entityType: EntityConstructor;
  fieldId: string;
}

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedFieldUpdateConfigService {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly dialog = inject(MatDialog);
  private readonly unsavedChangesService = inject(UnsavedChangesService);

  /**
   * Track processed entity revisions to prevent duplicate automated status updates within the same save operation
   */
  private readonly processedRevisions = new Set<string>();

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

    const changedFields = this.getChangedFields(entity, entityBeforeChanges);
    const changedFieldIds = changedFields.map((f) => f.fieldId);

    const relevantDirectRules: AffectedRule[] =
      this.getInheritanceRulesFromDirectEntity(entity.getConstructor()).filter(
        (r) => changedFieldIds.includes(r.rule.sourceValueField),
      );
    const relevantIndirectRules: AffectedRule[] =
      this.getInheritanceRulesReferencingThisEntity(
        entity.getConstructor(),
      ).filter((r) => changedFieldIds.includes(r.rule.sourceValueField));

    const affectedEntities: AffectedEntity[] = [
      ...(
        await Promise.all(
          relevantDirectRules.map((rule) =>
            this.loadAffectedEntitiesForRule(rule, entity),
          ),
        )
      ).flat(),
      ...(
        await Promise.all(
          relevantIndirectRules.map((rule) =>
            this.loadAffectedEntitiesForInheritanceRule(rule, entity),
          ),
        )
      ).flat(),
    ];

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
   * Find all Inheritance Rules on other entity types that list the given sourceReferenceEntity.
   *
   * For example:
   * Given the method parameter sourceReferenceEntity = School
   * Return any Rule in Child entity type, which refers to sourceReferenceEntity = School
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesFromDirectEntity(
    sourceReferenceEntity: EntityConstructor,
  ): AffectedRule[] {
    const rules: AffectedRule[] = [];

    for (const targetEntityType of this.entityRegistry.values()) {
      for (const [fieldId, fieldConfig] of targetEntityType.schema.entries()) {
        if (fieldConfig.defaultValue?.mode === "inherited-field") {
          const rule = fieldConfig.defaultValue
            .config as DefaultValueConfigInheritedField;

          if (
            rule?.sourceReferenceEntity === sourceReferenceEntity.ENTITY_TYPE
          ) {
            rules.push({
              rule,
              entityType: targetEntityType,
              fieldId,
            });
          }
        }
      }
    }

    return rules;
  }

  /**
   * Find all Inheritance Rules where the sourceReferenceField's entity type (in "additional") matches the given sourceReferenceEntity.
   *
   * For example:
   * Given the method parameter sourceReferenceEntity = School
   * Return any Rule in Child entity type, which has an undefined sourceReferenceEntity
   *      and the sourceReferenceField (on the Child entity) has an "additional" = School dataType
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesReferencingThisEntity(
    sourceReferenceEntity: EntityConstructor,
  ): AffectedRule[] {
    const rules: AffectedRule[] = [];

    for (const targetEntityType of this.entityRegistry.values()) {
      for (const [fieldId, fieldConfig] of targetEntityType.schema.entries()) {
        if (fieldConfig.defaultValue?.mode === "inherited-field") {
          const rule = fieldConfig.defaultValue
            .config as DefaultValueConfigInheritedField;

          // For inheritance rules: sourceReferenceEntity is undefined
          if (!rule?.sourceReferenceEntity && rule?.sourceReferenceField) {
            // Check if the sourceReferenceField could reference our entity type
            const referenceFieldConfig = targetEntityType.schema.get(
              rule.sourceReferenceField,
            );

            // If the reference field is configured to reference our entity type
            if (
              referenceFieldConfig?.dataType === "entity" &&
              referenceFieldConfig?.additional ===
                sourceReferenceEntity.ENTITY_TYPE
            ) {
              rules.push({
                rule,
                entityType: targetEntityType,
                fieldId,
              });
            }
          }
        }
      }
    }

    return rules;
  }

  /**
   * Load affected entities for a single automation rule (direct references)
   * Source entity has reference field pointing TO target entities
   */
  private async loadAffectedEntitiesForRule(
    affectedRule: AffectedRule,
    sourceEntity: Entity,
  ): Promise<AffectedEntity[]> {
    const { rule, entityType, fieldId } = affectedRule;

    const referencedEntityIds = sourceEntity[rule.sourceReferenceField];
    if (!referencedEntityIds) return [];

    const targetEntities = await this.loadEntitiesByIds(
      entityType,
      Array.isArray(referencedEntityIds)
        ? referencedEntityIds
        : [referencedEntityIds],
    );

    return this.processTargetEntities(
      targetEntities,
      rule,
      sourceEntity,
      entityType,
      fieldId,
    );
  }

  /**
   * Load affected entities for a single inheritance rule (indirect references)
   * Target entities have reference field pointing TO source entity
   */
  private async loadAffectedEntitiesForInheritanceRule(
    affectedRule: AffectedRule,
    sourceEntity: Entity,
  ): Promise<AffectedEntity[]> {
    const { rule, entityType, fieldId } = affectedRule;

    // Load all entities of target type and filter for those referencing source entity
    const allTargetEntities = await this.entityMapper.loadType(entityType);
    const targetEntities = allTargetEntities.filter(
      (entity) => entity[rule.sourceReferenceField] === sourceEntity.getId(),
    );

    return this.processTargetEntities(
      targetEntities,
      rule,
      sourceEntity,
      entityType,
      fieldId,
    );
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

        affectedEntities.push({
          id: targetEntity.getId(),
          newValue: newValue,
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
            `AutomatedFieldUpdateConfigService: Failed to load entity of type ${entityType.ENTITY_TYPE} with ID ${id}: ${error}`,
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
    updatesByEntityId.forEach((updates) => {
      const entity = updates[0].affectedEntity;
      if (entity) {
        updates.forEach((update) => {
          entity[update.targetFieldId] = update.newValue;
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
    const dialogRef = this.dialog.open(AutomatedFieldUpdateComponent, {
      maxHeight: "90vh",
      data: { entities: entitiesToUpdate },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }
}
