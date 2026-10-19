import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import type { AffectedEntity } from "./automated-field-update.component";
import { lastValueFrom } from "rxjs";
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
} from "../inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { differenceWith, isEqual } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";
import {
  addAndRemoveValues,
  addMissingValues,
  getRemovedValues,
  isEmptyValue,
} from "../add-missing-values";
import { CommonValue, getCommonValue } from "../get-common-value";

/** the property of an entity that a reference index can be created for */
type IndexedProperty = Parameters<
  DatabaseIndexingService["generateIndexOnProperty"]
>[2];

/**
 * Represents a rule with its associated entity type and field information
 */
interface AffectedRule {
  rule: DefaultValueConfigInheritedField;
  entityType: EntityConstructor;
  fieldId: string;
}

/**
 * The new value of a target entity, which is its current value if the linked entities have no value in common.
 */
interface NewValue {
  value: any;
  hasNoCommonValue: boolean;
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
  private readonly dbIndexing = inject(DatabaseIndexingService);

  /** ids of the reference indexes that were already requested in this session */
  private readonly requestedReferenceIndexes = new Set<string>();

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
        (r) =>
          changedFieldIds.includes(r.rule.sourceValueField) ||
          changedFieldIds.includes(r.rule.sourceReferenceField),
      );
    const relevantIndirectRules: AffectedRule[] =
      this.getInheritanceRulesReferencingThisEntity(
        entity.getConstructor(),
      ).filter((r) => changedFieldIds.includes(r.rule.sourceValueField));

    const affectedEntities: AffectedEntity[] = [
      ...(
        await Promise.all(
          relevantDirectRules.map((rule) =>
            this.loadAffectedEntitiesForRule(
              rule,
              entity,
              entityBeforeChanges,
              changedFieldIds.includes(rule.rule.sourceValueField),
            ),
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
   * Whether the given field of the entity is passed on to other entities that the entity links to
   * by an automation rule (e.g. a sub-item's field that updates its linked parent).
   */
  public hasLinkedRecordsToUpdate(entity: Entity, fieldId: string): boolean {
    return (
      !entity.isNew &&
      this.getRulesUsingFieldAsSource(entity.getConstructor(), fieldId).some(
        ({ rule }) => asArray(entity[rule.sourceReferenceField] ?? []).length,
      )
    );
  }

  /**
   * Open the dialog to update the entities linked by the given entity with the value of the given field,
   * regardless of whether the field was changed recently.
   * @return whether there were any linked entities to update
   */
  public async updateLinkedRecords(
    entity: Entity,
    fieldId: string,
  ): Promise<boolean> {
    const affectedEntities = (
      await Promise.all(
        this.getRulesUsingFieldAsSource(entity.getConstructor(), fieldId).map(
          (rule) => this.loadAffectedEntitiesForRule(rule, entity, entity),
        ),
      )
    ).flat();

    if (affectedEntities.length > 0) {
      await this.confirmAndSaveAffectedEntities(affectedEntities);
    }
    return affectedEntities.length > 0;
  }

  private getRulesUsingFieldAsSource(
    entityType: EntityConstructor,
    fieldId: string,
  ): AffectedRule[] {
    return this.getInheritanceRulesFromDirectEntity(entityType).filter(
      ({ rule }) => rule.sourceValueField === fieldId,
    );
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
   * @param valueChanged whether the source value changed (all linked entities are affected),
   *   or only the link (then only newly linked entities get the value, and unlinked ones may lose it)
   */
  private async loadAffectedEntitiesForRule(
    affectedRule: AffectedRule,
    sourceEntity: Entity,
    sourceEntityBeforeChanges: Entity,
    valueChanged = true,
  ): Promise<AffectedEntity[]> {
    const { rule, entityType } = affectedRule;

    const linkedIds = this.getLinkedIds(sourceEntity, rule);
    const previousIds = sourceEntityBeforeChanges.isNew
      ? []
      : this.getLinkedIds(sourceEntityBeforeChanges, rule);
    // a changed link alone only passes on a value that is set, instead of clearing the value of the new parent
    const idsToUpdate = valueChanged
      ? linkedIds
      : linkedIds.filter(
          (id) =>
            !previousIds.includes(id) &&
            !isEmptyValue(this.calculateNewValue(sourceEntity, rule)),
        );

    const targetEntities = await this.loadEntitiesByIds(
      entityType,
      idsToUpdate,
    );
    const previouslyLinkedTargets = targetEntities.filter((target) =>
      previousIds.includes(target.getId()),
    );
    const newValue: NewValue = {
      value: this.calculateNewValue(sourceEntity, rule),
      hasNoCommonValue: false,
    };

    return [
      ...this.processTargetEntities(
        targetEntities,
        affectedRule,
        sourceEntity,
        new Map(
          targetEntities.map((entity): [string, NewValue] => [
            entity.getId(),
            newValue,
          ]),
        ),
        await this.loadRemovedValues(
          previouslyLinkedTargets,
          affectedRule,
          getRemovedValues(
            sourceEntityBeforeChanges.isNew
              ? []
              : this.calculateNewValue(sourceEntityBeforeChanges, rule),
            this.calculateNewValue(sourceEntity, rule),
          ),
        ),
      ),
      ...(await this.loadAffectedEntitiesForUnlinkedEntities(
        affectedRule,
        sourceEntityBeforeChanges,
        previousIds.filter((id) => !linkedIds.includes(id)),
      )),
    ];
  }

  private getLinkedIds(
    entity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): string[] {
    const referencedIds = entity[rule.sourceReferenceField];
    return referencedIds ? asArray(referencedIds) : [];
  }

  /**
   * Load the entities that the source entity is no longer linked to,
   * to suggest removing the values only the source entity contributed to their collected field.
   */
  private async loadAffectedEntitiesForUnlinkedEntities(
    affectedRule: AffectedRule,
    sourceEntityBeforeChanges: Entity,
    unlinkedIds: string[],
  ): Promise<AffectedEntity[]> {
    const { rule, entityType, fieldId } = affectedRule;
    if (
      unlinkedIds.length === 0 ||
      !isCollectingFromLinkedRecords(entityType.schema.get(fieldId))
    ) {
      return [];
    }

    const unlinkedTargets = await this.loadEntitiesByIds(
      entityType,
      unlinkedIds,
    );
    return this.processTargetEntities(
      unlinkedTargets,
      affectedRule,
      sourceEntityBeforeChanges,
      new Map(
        unlinkedTargets.map((target): [string, NewValue] => [
          target.getId(),
          { value: [], hasNoCommonValue: false },
        ]),
      ),
      await this.loadRemovedValues(
        unlinkedTargets,
        affectedRule,
        getRemovedValues(
          this.calculateNewValue(sourceEntityBeforeChanges, rule),
          [],
        ),
      ),
    ).map((affectedEntity) => ({ ...affectedEntity, unlinked: true }));
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

    const targetEntities = await this.loadRecordsLinkingTo(
      entityType,
      rule.sourceReferenceField,
      sourceEntity.getId(),
    );

    const newValues = new Map<string, NewValue>(
      await Promise.all(
        targetEntities.map(async (entity): Promise<[string, NewValue]> => [
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
   * If they have different values or some linked entities cannot be loaded,
   * the target's current value is returned.
   * If none of them has a value, the value is cleared like for a single linked entity.
   */
  private async loadNewValue(
    targetEntity: Entity,
    { rule, fieldId }: AffectedRule,
    sourceEntity: Entity,
  ): Promise<NewValue> {
    const otherIds = asArray(targetEntity[rule.sourceReferenceField]).filter(
      (id) => id !== sourceEntity.getId(),
    );
    if (otherIds.length === 0) {
      return {
        value: this.calculateNewValue(sourceEntity, rule),
        hasNoCommonValue: false,
      };
    }

    const otherEntities = await this.loadEntitiesByIds(
      sourceEntity.getConstructor(),
      otherIds,
    );
    const commonValue: CommonValue | undefined =
      otherEntities.length === otherIds.length
        ? this.calculateCommonValue([sourceEntity, ...otherEntities], rule)
        : undefined;

    if (!commonValue || commonValue.isConflict) {
      return {
        value: this.transformSourceValueToDatabaseFormat(
          targetEntity[fieldId],
          targetEntity,
          fieldId,
          this.entitySchemaService,
        ),
        hasNoCommonValue: true,
      };
    }
    return { value: commonValue.value, hasNoCommonValue: false };
  }

  /**
   * Find the values that the source entity no longer has and that are not used by any other entity linking to the same target,
   * for fields that collect the values of their linked entities (i.e. these values can be removed from the target).
   * @param removedValues the values that the source entity lost for the target entities
   * @return the values to remove by target entity id
   */
  private async loadRemovedValues(
    targetEntities: Entity[],
    { rule, entityType, fieldId }: AffectedRule,
    removedValues: any[],
  ): Promise<Map<string, any[]>> {
    if (
      removedValues.length === 0 ||
      !isCollectingFromLinkedRecords(entityType.schema.get(fieldId))
    ) {
      return new Map();
    }

    try {
      return new Map(
        await Promise.all(
          targetEntities.map(async (target): Promise<[string, any[]]> => [
            target.getId(),
            differenceWith(
              removedValues,
              await this.collectValuesOfLinkedRecords(target, rule),
              isEqual,
            ),
          ]),
        ),
      );
    } catch (error) {
      Logging.warn(
        "AutomatedFieldUpdateConfigService: Could not check which values are still used by other linked entities",
        { entityType: entityType.ENTITY_TYPE, fieldId },
        error,
      );
      return new Map();
    }
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
    newValues: Map<string, NewValue>,
    removedValues: Map<string, any[]> = new Map(),
  ): AffectedEntity[] {
    const affectedEntities: AffectedEntity[] = [];
    const sourceEntityType = sourceEntity.getConstructor();
    const relatedReferenceFieldEntityType = rule.sourceReferenceEntity
      ? sourceEntityType
      : targetEntityType;
    const fieldConfig = targetEntityType.schema.get(targetFieldId);
    const addToExisting = isCollectingFromLinkedRecords(fieldConfig);
    const combineWithCurrentValue = addToExisting
      ? addAndRemoveValues
      : (_currentValue: any, newValue: any) => newValue;

    for (const targetEntity of targetEntities) {
      // compare in database format, as the loaded entity holds e.g. enum objects instead of ids
      const currentValue = this.transformSourceValueToDatabaseFormat(
        targetEntity[targetFieldId],
        targetEntity,
        targetFieldId,
        this.entitySchemaService,
      );
      const { value, hasNoCommonValue } = newValues.get(targetEntity.getId());
      const newValue = combineWithCurrentValue(
        currentValue,
        value,
        removedValues.get(targetEntity.getId()),
      );
      // an existing value is kept, but the user is informed that there is nothing to suggest
      const showNoCommonValue = hasNoCommonValue && !isEmptyValue(currentValue);
      if (isEqual(currentValue, newValue) && !showNoCommonValue) continue;

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
        hasNoCommonValue: showNoCommonValue,
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
   */
  public calculateCommonValue(
    sourceEntities: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): CommonValue {
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
    const linkedRecords = await this.loadRecordsLinkingTo(
      rule.sourceReferenceEntity,
      rule.sourceReferenceField,
      entity.getId(),
    );
    return linkedRecords.reduce(
      (values, record) =>
        addMissingValues(values, this.calculateNewValue(record, rule)),
      [],
    );
  }

  /**
   * Load the records of the given type that reference the given entity in the given field
   * (a single reference or a list of references) through a database index,
   * instead of loading and checking all records of the type.
   * If the index cannot be used (e.g. it cannot be created in online-only mode),
   * all records of the type are loaded and checked instead.
   */
  private async loadRecordsLinkingTo(
    entityType: string | EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]> {
    const ctor =
      typeof entityType === "string"
        ? this.entityRegistry.get(entityType)
        : entityType;
    if (!ctor?.schema.has(referenceField)) {
      return [];
    }

    try {
      return await this.queryLinkingRecordsIndex(
        ctor,
        referenceField,
        entityId,
      );
    } catch (error) {
      Logging.warn(
        "AutomatedFieldUpdateConfigService: Could not use the index of linked records, loading all records of the type instead",
        { entityType: ctor.ENTITY_TYPE, referenceField },
        error,
      );
      return (await this.entityMapper.loadType(ctor)).filter((record) =>
        asArray(record[referenceField]).includes(entityId),
      );
    }
  }

  private async queryLinkingRecordsIndex(
    ctor: EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]> {
    const indexId = `linking_${ctor.ENTITY_TYPE}_${referenceField}`;
    if (!this.requestedReferenceIndexes.has(indexId)) {
      this.requestedReferenceIndexes.add(indexId);
      // the query below waits until the index is ready
      this.dbIndexing
        .generateIndexOnProperty(
          indexId,
          ctor,
          referenceField as IndexedProperty,
        )
        .catch((error) =>
          Logging.warn(
            "AutomatedFieldUpdateConfigService: Could not create the index of linked records",
            { indexId },
            error,
          ),
        );
    }

    return this.dbIndexing.queryIndexDocs(
      ctor,
      `${indexId}/by_${referenceField}`,
      entityId,
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
    // The reference field can hold ids of several entity types. Ids without any type prefix
    // are still loaded, because the mapper adds the prefix of the given type itself.
    const typePrefix = `${entityType.ENTITY_TYPE}:`;
    const idsOfEntityType = entityIds.filter(
      (id) => String(id).startsWith(typePrefix) || !String(id).includes(":"),
    );

    const loadedEntities = await Promise.all(
      idsOfEntityType.map(async (id) => {
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
    // loaded lazily to avoid a circular import (dialog -> field edit -> inherited value button -> this service)
    const { AutomatedFieldUpdateComponent } =
      await import("./automated-field-update.component");
    const dialogRef = this.dialog.open(AutomatedFieldUpdateComponent, {
      maxHeight: "90vh",
      data: { entities: entitiesToUpdate },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }
}
