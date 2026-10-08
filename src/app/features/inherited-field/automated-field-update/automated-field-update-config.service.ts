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
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
} from "../inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { isEqual } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";
import { addMissingValues } from "../add-missing-values";
import { getCommonValue } from "../get-common-value";

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
  private readonly entitySchemaService = inject(EntitySchemaService);

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
    return this.getAllRules().filter(
      ({ rule }) =>
        rule?.sourceReferenceEntity === sourceReferenceEntity.ENTITY_TYPE,
    );
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
    return this.getAllRules().filter(({ rule, entityType }) => {
      // For inheritance rules: sourceReferenceEntity is undefined
      if (rule?.sourceReferenceEntity || !rule?.sourceReferenceField) {
        return false;
      }

      // Check if the sourceReferenceField is configured to reference our entity type
      const referenceFieldConfig = entityType.schema.get(
        rule.sourceReferenceField,
      );
      return (
        referenceFieldConfig?.dataType === "entity" &&
        referenceFieldConfig?.additional === sourceReferenceEntity.ENTITY_TYPE
      );
    });
  }

  /**
   * Get the inheritance and automation rules defined in the field schemas of all entity types.
   */
  private getAllRules(): AffectedRule[] {
    return [...this.entityRegistry.values()].flatMap((entityType) =>
      [...entityType.schema.entries()]
        .filter(([, field]) => field.defaultValue?.mode === "inherited-field")
        .map(([fieldId, field]) => ({
          rule: field.defaultValue.config as DefaultValueConfigInheritedField,
          entityType,
          fieldId,
        })),
    );
  }

  /**
   * Load affected entities for a single automation rule (direct references)
   * Source entity has reference field pointing TO target entities
   */
  private async loadAffectedEntitiesForRule(
    affectedRule: AffectedRule,
    sourceEntity: Entity,
  ): Promise<AffectedEntity[]> {
    const { rule, entityType } = affectedRule;

    const referencedEntityIds = sourceEntity[rule.sourceReferenceField];
    if (!referencedEntityIds) return [];

    const targetEntities = await this.loadEntitiesByIds(
      entityType,
      asArray(referencedEntityIds),
    );
    const newValue = this.calculateNewValue(sourceEntity, rule);

    return this.processTargetEntities(
      targetEntities,
      affectedRule,
      sourceEntity,
      new Map(targetEntities.map((entity) => [entity.getId(), newValue])),
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
    const { rule, entityType } = affectedRule;

    // Load all entities of target type and filter for those referencing source entity
    const allTargetEntities = await this.entityMapper.loadType(entityType);
    const targetEntities = allTargetEntities.filter((entity) =>
      asArray(entity[rule.sourceReferenceField]).includes(sourceEntity.getId()),
    );

    const newValues = new Map<string, any>(
      await Promise.all(
        targetEntities.map(async (entity): Promise<[string, any]> => [
          entity.getId(),
          await this.loadNewValue(entity, affectedRule, sourceEntity),
        ]),
      ),
    );

    return this.processTargetEntities(
      targetEntities,
      affectedRule,
      sourceEntity,
      newValues,
    );
  }

  /**
   * Get the new value for a target entity linking to the (already updated) source entity.
   * If the target links to several entities, it only inherits a value shared by all of them.
   * @return the new value, or the target's current value if the linked entities have
   *         different values or some cannot be loaded (i.e. there is nothing to update)
   */
  private async loadNewValue(
    targetEntity: Entity,
    { rule, fieldId }: AffectedRule,
    sourceEntity: Entity,
  ): Promise<any> {
    const otherIds = asArray(targetEntity[rule.sourceReferenceField]).filter(
      (id) => id !== sourceEntity.getId(),
    );
    if (otherIds.length === 0) {
      return this.calculateNewValue(sourceEntity, rule);
    }

    const otherEntities = await this.loadEntitiesByIds(
      sourceEntity.getConstructor(),
      otherIds,
    );
    const sharedValue =
      otherEntities.length === otherIds.length
        ? this.calculateCommonValue([sourceEntity, ...otherEntities], rule)
        : undefined;

    return (
      sharedValue ??
      this.transformSourceValueToDatabaseFormat(
        targetEntity[fieldId],
        targetEntity,
        fieldId,
        this.entitySchemaService,
      )
    );
  }

  /**
   * Common logic for processing target entities and creating AffectedEntity objects
   */
  private processTargetEntities(
    targetEntities: Entity[],
    {
      rule,
      entityType: targetEntityType,
      fieldId: targetFieldId,
    }: AffectedRule,
    sourceEntity: Entity,
    newValues: Map<string, any>,
  ): AffectedEntity[] {
    const affectedEntities: AffectedEntity[] = [];
    const sourceEntityType = sourceEntity.getConstructor();
    const relatedReferenceFieldEntityType = rule.sourceReferenceEntity
      ? sourceEntityType
      : targetEntityType;
    const fieldConfig = targetEntityType.schema.get(targetFieldId);
    const addToExisting = isCollectingFromLinkedRecords(fieldConfig);
    const combineWithCurrentValue = addToExisting
      ? addMissingValues
      : (_currentValue: any, newValue: any) => newValue;

    for (const targetEntity of targetEntities) {
      // compare in database format, as the loaded entity holds e.g. enum objects instead of ids
      const currentValue = this.transformSourceValueToDatabaseFormat(
        targetEntity[targetFieldId],
        targetEntity,
        targetFieldId,
        this.entitySchemaService,
      );
      const newValue = combineWithCurrentValue(
        currentValue,
        newValues.get(targetEntity.getId()),
      );
      if (isEqual(currentValue, newValue)) continue;

      affectedEntities.push({
        id: targetEntity.getId(),
        newValue: newValue,
        targetFieldId,
        targetEntityType,
        selectedField: { ...fieldConfig, id: targetFieldId },
        affectedEntity: targetEntity,
        relatedReferenceField: rule.sourceReferenceField,
        relatedReferenceFieldEntityType,
        addToExisting,
      });
    }

    return affectedEntities;
  }

  /**
   * Calculate the new value from source entity with value mapping applied.
   * Transforms to database format for consistent handling of all datatypes.
   * @param sourceEntity The entity containing the source value
   * @param rule The inheritance rule configuration
   */
  public calculateNewValue(
    sourceEntity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): any {
    const sourceValue = this.transformSourceValueToDatabaseFormat(
      sourceEntity?.[rule.sourceValueField],
      sourceEntity,
      rule.sourceValueField,
      this.entitySchemaService,
    );

    if (!rule.valueMapping) {
      return sourceValue;
    }

    const mapValue = (value: string) => rule.valueMapping[value] ?? value;
    // flatMap: mapped values are arrays if the target field is multi-select
    return Array.isArray(sourceValue)
      ? [...new Set(sourceValue.flatMap(mapValue))]
      : mapValue(sourceValue);
  }

  /**
   * Calculate the new value that all given source entities have in common
   * (see {@link calculateNewValue}), ignoring empty values.
   * @return the shared value or undefined if the values differ
   */
  public calculateCommonValue(
    sourceEntities: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): any {
    return getCommonValue(
      sourceEntities.map((entity) => this.calculateNewValue(entity, rule)),
    );
  }

  /**
   * Collect the values of all records that link to the given entity as defined by the automation rule
   * (e.g. the cities of all children linking to a school), skipping duplicates.
   * @param entity The record that the related records link to
   * @param rule The automation rule (with sourceReferenceEntity)
   * @return the combined values in database format
   */
  public async collectValuesOfLinkedRecords(
    entity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): Promise<any[]> {
    const linkedRecords = (
      await this.entityMapper.loadType(rule.sourceReferenceEntity)
    ).filter((record) =>
      asArray(record[rule.sourceReferenceField]).includes(entity.getId()),
    );
    return linkedRecords.reduce(
      (values, record) =>
        addMissingValues(values, this.calculateNewValue(record, rule)),
      [],
    );
  }

  /**
   * Transform a source field value to database format for inherited field operations.
   * This finds the field schema from the source entity and applies the transformation.
   *
   * @param value The value to transform
   * @param sourceEntity The entity containing the value
   * @param sourceFieldId The field ID where the value comes from
   * @param entitySchemaService The schema service for transformations
   */
  public transformSourceValueToDatabaseFormat(
    value: any,
    sourceEntity: Entity,
    sourceFieldId: string,
    entitySchemaService: EntitySchemaService,
  ): any {
    if (value === null || value === undefined) {
      return value;
    }

    const sourceFieldConfig = sourceEntity
      .getConstructor()
      .schema.get(sourceFieldId);

    if (!sourceFieldConfig) {
      return value;
    }

    return entitySchemaService.valueToDatabaseFormat(
      value,
      sourceFieldConfig,
      sourceEntity,
    );
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
            "AutomatedFieldUpdateConfigService: Failed to load entity for automated field update",
            { entityType: entityType.ENTITY_TYPE, entityId: id },
            error,
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
