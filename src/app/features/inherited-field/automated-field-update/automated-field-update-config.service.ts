import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import type {
  AffectedEntity,
  EnteredValue,
  UpdateTrigger,
} from "./automated-field-update.component";
import { lastValueFrom } from "rxjs";
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
} from "../inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { differenceWith, isEqual, uniq } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";
import {
  addAndRemoveValues,
  addMissingValues,
  isEmptyValue,
} from "../add-missing-values";
import { CommonValue, getCommonValue, isSameValue } from "../get-common-value";
import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";
import { ChangeSet, ChangeSetState, isLinkedTo } from "./change-set";

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
  noCommonValue?: NoCommonValueReason;

  /** whether the target is no longer linked to any of the changed records */
  unlinked?: boolean;
}

/** An entity whose fields changed, so that the entities based on them have to be calculated (again) */
interface QueuedChange {
  /** the entity as it is saved */
  entity: Entity;
  /** how many levels above the changed entity it is (0 = the changed entity itself) */
  level: number;
  changedFields: string[];
  /** only update the entities that the entity links to (not the ones linking to it) */
  onlyLinkedEntities?: boolean;
}

/** The state of one calculation of the affected entities */
interface SuggestionRun {
  trigger: UpdateTrigger;
  changeSet: ChangeSet;
  enteredValues: EnteredValue[];
  /** the affected entities found so far, by entity id and field */
  affectedEntities: Map<string, AffectedEntity>;
}

/** Number of levels above the changed entity that are included in one update dialog. */
export const MAX_HIERARCHY_LEVELS = 10;

/** Safety limit for the calculation of the affected entities, in case their values do not settle (e.g. in a loop) */
const MAX_STEPS = 1000;

/**
 * The value that the linked parent records of a record have in common.
 */
export interface CommonValueOfParents {
  /** the value the parent records have in common (in database format) */
  value?: unknown;

  /** why the parent records provide no value in common, if they don't */
  noCommonValue?: NoCommonValueReason;
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

    await this.confirmAndSaveAffectedEntities({
      entity,
      before: entityBeforeChanges,
    });
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
  public updateLinkedRecords(
    entity: Entity,
    fieldId: string,
  ): Promise<boolean> {
    return this.confirmAndSaveAffectedEntities({
      entity,
      before: entity,
      fieldId,
    });
  }

  /**
   * Find the entities that the rules would update, level by level up the hierarchy
   * (e.g. the school of a child and the parent school of that school).
   *
   * The value of each entity is calculated from all its linked records, with the changes found so far
   * (see {@link ChangeSet}). Whenever an entity gets another value, the entities based on it are calculated again.
   * So the result does not depend on the order or the number of paths over which an entity is reached.
   * @param trigger the change that starts the update
   * @param enteredValues values the user entered for affected entities (database format),
   *   which the entities above are based on instead of the suggestions
   * @return the affected entities, ordered by level
   */
  private async findAffectedEntities(
    trigger: UpdateTrigger,
    enteredValues: EnteredValue[] = [],
  ): Promise<AffectedEntity[]> {
    const changedFields = trigger.fieldId
      ? [trigger.fieldId]
      : this.getChangedFields(trigger.entity, trigger.before).map(
          (f) => f.fieldId,
        );
    const changeSet = new ChangeSet(
      trigger.entity,
      trigger.before,
      changedFields,
    );
    const run: SuggestionRun = {
      trigger,
      changeSet,
      enteredValues,
      affectedEntities: new Map(),
    };
    const queue: QueuedChange[] = [
      {
        entity: trigger.entity,
        level: 0,
        changedFields,
        onlyLinkedEntities: !!trigger.fieldId,
      },
    ];

    for (let step = 0; queue.length > 0; step++) {
      if (step >= MAX_STEPS) {
        Logging.warn(
          "AutomatedFieldUpdateConfigService: Stopped looking for affected entities after the maximum number of steps",
          { entityType: trigger.entity.getType() },
        );
        break;
      }
      const change = queue.shift();
      if (change.level >= MAX_HIERARCHY_LEVELS) continue;

      const source = changeSet.get(change.entity, "after");
      const level = change.level + 1;
      for (const rule of this.getTriggeredRules(source, change)) {
        for (const target of await this.loadTargets(rule, source, changeSet)) {
          if (await this.updateSuggestion(run, target, rule, source, level)) {
            queue.push({
              entity: target,
              level,
              changedFields: [rule.fieldId],
            });
          }
        }
      }
    }

    return [...run.affectedEntities.values()].sort((a, b) => a.level - b.level);
  }

  /**
   * Calculate the suggested value of the target again and use it (or the value the user entered)
   * for the entities above.
   * @param level how many levels above the changed entity the target is reached
   * @return whether the target got another value, so that the entities based on it have to be calculated again
   */
  private async updateSuggestion(
    { trigger, changeSet, enteredValues, affectedEntities }: SuggestionRun,
    target: Entity,
    rule: AffectedRule,
    source: Entity,
    level: number,
  ): Promise<boolean> {
    if (target.getId() === trigger.entity.getId()) return false;

    const key = `${target.getId()}|${rule.fieldId}`;
    const existing = affectedEntities.get(key);
    const suggestion = await this.suggestValue(target, rule, source, changeSet);
    if (suggestion) {
      affectedEntities.set(key, {
        ...suggestion,
        level: Math.max(level, existing?.level ?? 0),
        via: uniq([...(existing?.via ?? []), source.getId()]),
      });
    } else {
      affectedEntities.delete(key);
    }

    const entered = enteredValues.find(
      (e) => e.id === target.getId() && e.targetFieldId === rule.fieldId,
    );
    const value = entered
      ? entered.value
      : (suggestion?.newValue ?? this.getDatabaseValue(target, rule.fieldId));
    return this.setPendingValue(changeSet, target, rule, value);
  }

  /**
   * The rules that pass on the changed fields of the source entity.
   */
  private getTriggeredRules(
    source: Entity,
    { changedFields, onlyLinkedEntities }: QueuedChange,
  ): AffectedRule[] {
    const isChanged = (fieldId: string) => changedFields.includes(fieldId);
    const directRules = this.getInheritanceRulesFromDirectEntity(
      source.getConstructor(),
    ).filter(
      ({ rule }) =>
        isChanged(rule.sourceValueField) ||
        isChanged(rule.sourceReferenceField),
    );
    const indirectRules = onlyLinkedEntities
      ? []
      : this.getInheritanceRulesReferencingThisEntity(
          source.getConstructor(),
        ).filter(({ rule }) => isChanged(rule.sourceValueField));
    return [...directRules, ...indirectRules];
  }

  /**
   * Load the entities that the rule would update when the source entity changes.
   * @param source the changed entity (after the change)
   * @return the affected entities as they are saved
   */
  private async loadTargets(
    { rule, entityType }: AffectedRule,
    source: Entity,
    changeSet: ChangeSet,
  ): Promise<Entity[]> {
    if (!rule.sourceReferenceEntity) {
      return this.loadRecordsLinkingTo(
        entityType,
        rule.sourceReferenceField,
        source.getId(),
      );
    }
    // the entities linked before and after the change (they may lose values)
    return this.loadEntitiesByIds(
      entityType,
      uniq([
        ...this.getLinkedIds(source, rule),
        ...this.getLinkedIds(changeSet.get(source, "before"), rule),
      ]),
    );
  }

  /**
   * Use the given value of the affected entity (database format) for the entities above it.
   * @return whether the entity got another value, so that the entities based on it have to be calculated again
   */
  private setPendingValue(
    changeSet: ChangeSet,
    target: Entity,
    { entityType, fieldId }: AffectedRule,
    value: unknown,
  ): boolean {
    const pendingValue = this.getDatabaseValue(
      changeSet.get(target, "after"),
      fieldId,
    );
    if (isSameValue(pendingValue, value)) return false;

    changeSet.setValue(
      target,
      fieldId,
      this.entitySchemaService.valueToEntityFormat(value, {
        ...entityType.schema.get(fieldId),
        id: fieldId,
      }),
      isSameValue(this.getDatabaseValue(target, fieldId), value),
    );
    return true;
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

  private getLinkedIds(
    entity: Entity | undefined,
    rule: DefaultValueConfigInheritedField,
  ): string[] {
    const referencedIds = entity?.[rule.sourceReferenceField];
    return referencedIds ? asArray(referencedIds) : [];
  }

  /**
   * Calculate the suggested value of an affected entity from its linked records after the change.
   * @param target the affected entity as it is saved
   * @param source the changed entity that the affected entity is reached from (after the change)
   * @return the affected entity with the suggested value, or undefined if its value does not change
   */
  private async suggestValue(
    target: Entity,
    affectedRule: AffectedRule,
    source: Entity,
    changeSet: ChangeSet,
  ): Promise<AffectedEntity | undefined> {
    const { rule, entityType, fieldId } = affectedRule;
    let newValue: NewValue | undefined;
    if (!rule.sourceReferenceEntity) {
      newValue = await this.loadNewValue(
        target,
        affectedRule,
        source,
        changeSet,
      );
    } else if (isCollectingFromLinkedRecords(entityType.schema.get(fieldId))) {
      newValue = await this.loadCollectedValue(target, affectedRule, changeSet);
    } else {
      newValue = this.getValueOfChangedRecord(target, rule, changeSet);
    }
    return newValue
      ? this.toAffectedEntity(target, affectedRule, source, newValue)
      : undefined;
  }

  /**
   * Get the new value of a field that collects the values of the records linking to it:
   * the values of the changed records linking to it are added, and the values that the changed records lost
   * are removed, unless a record linking to it still has them.
   */
  private async loadCollectedValue(
    target: Entity,
    { rule, fieldId }: AffectedRule,
    changeSet: ChangeSet,
  ): Promise<NewValue> {
    const linkingTo = (saved: Entity[], state: ChangeSetState) =>
      changeSet.linkingTo(
        saved,
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        target.getId(),
        state,
      );
    const changedRecords = linkingTo([], "after");
    const lostValues = differenceWith(
      this.collectValues(linkingTo([], "before"), rule),
      this.collectValues(changedRecords, rule),
      isEqual,
    );

    let removedValues = [];
    try {
      if (lostValues.length > 0) {
        const saved = await this.loadRecordsLinkingTo(
          rule.sourceReferenceEntity,
          rule.sourceReferenceField,
          target.getId(),
        );
        removedValues = differenceWith(
          lostValues,
          this.collectValues(linkingTo(saved, "after"), rule),
          isEqual,
        );
      }
    } catch (error) {
      Logging.warn(
        "AutomatedFieldUpdateConfigService: Could not check which values are still used by other linked entities",
        { entityType: target.getType(), fieldId },
        error,
      );
    }

    return {
      value: addAndRemoveValues(
        this.getDatabaseValue(target, fieldId),
        this.collectValues(changedRecords, rule),
        removedValues,
      ),
      unlinked: changedRecords.length === 0,
    };
  }

  /**
   * Get the new value of a field that takes the value of a linked record: the value of a changed record linking to it,
   * if that value changed or the link is new (then only if there is a value, instead of clearing the existing one).
   * @return undefined if no changed record passes on its value
   */
  private getValueOfChangedRecord(
    target: Entity,
    rule: DefaultValueConfigInheritedField,
    changeSet: ChangeSet,
  ): NewValue | undefined {
    const source = changeSet
      .changedRecordsLinkingTo(
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        target.getId(),
      )
      .find(
        (record) =>
          changeSet.isChanged(record, rule.sourceValueField) ||
          (!isLinkedTo(
            changeSet.get(record, "before"),
            rule.sourceReferenceField,
            target.getId(),
          ) &&
            !isEmptyValue(this.calculateNewValue(record, rule))),
      );
    return source ? { value: this.calculateNewValue(source, rule) } : undefined;
  }

  /**
   * Get the new value for a target entity linking to the (already updated) source entity.
   * If the target links to several entities, it only inherits a value shared by all of them.
   * If they have different values or some linked entities cannot be loaded,
   * the target's current value is returned.
   * If none of them has a value, the value is cleared like for a single linked entity.
   * @param changeSet the changes, whose values are used instead of the saved ones
   */
  private async loadNewValue(
    targetEntity: Entity,
    { rule, fieldId }: AffectedRule,
    sourceEntity: Entity,
    changeSet: ChangeSet,
  ): Promise<NewValue> {
    const otherIds = asArray(targetEntity[rule.sourceReferenceField]).filter(
      (id) => id !== sourceEntity.getId(),
    );
    if (otherIds.length === 0) {
      return { value: this.calculateNewValue(sourceEntity, rule) };
    }

    const { value, noCommonValue } = await this.loadCommonValue(
      otherIds,
      rule,
      {
        parentType: sourceEntity.getConstructor(),
        loadedParents: [sourceEntity],
        changeSet,
      },
    );

    if (noCommonValue) {
      return {
        value: this.getDatabaseValue(targetEntity, fieldId),
        noCommonValue,
      };
    }
    return { value };
  }

  /**
   * The affected entity with its new value, or undefined if the value does not change.
   */
  private toAffectedEntity(
    targetEntity: Entity,
    {
      rule,
      entityType: targetEntityType,
      fieldId: targetFieldId,
    }: AffectedRule,
    sourceEntity: Entity,
    { value: newValue, noCommonValue, unlinked }: NewValue,
  ): AffectedEntity | undefined {
    // compare in database format, as the loaded entity holds e.g. enum objects instead of ids
    const currentValue = this.getDatabaseValue(targetEntity, targetFieldId);
    // an existing value is kept, but the user is informed that there is nothing to suggest
    const shownNoCommonValue = isEmptyValue(currentValue)
      ? undefined
      : noCommonValue;
    if (isSameValue(currentValue, newValue) && !shownNoCommonValue) {
      return undefined;
    }

    const fieldConfig = targetEntityType.schema.get(targetFieldId);
    return {
      id: targetEntity.getId(),
      newValue,
      targetFieldId,
      targetEntityType,
      selectedField: { ...fieldConfig, id: targetFieldId },
      affectedEntity: targetEntity,
      relatedReferenceField: rule.sourceReferenceField,
      relatedReferenceFieldEntityType: rule.sourceReferenceEntity
        ? sourceEntity.getConstructor()
        : targetEntityType,
      sourceFieldId: rule.sourceValueField,
      addToExisting: isCollectingFromLinkedRecords(fieldConfig),
      noCommonValue: shownNoCommonValue,
      unlinked: unlinked || undefined,
    };
  }

  /** The value of the field of the entity in database format */
  private getDatabaseValue(entity: Entity, fieldId: string): any {
    return this.transformSourceValueToDatabaseFormat(
      entity[fieldId],
      entity,
      fieldId,
      this.entitySchemaService,
    );
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
   * Load the linked parent records and get the value they all have in common
   * (see {@link calculateCommonValue}).
   * If any of them cannot be loaded (e.g. the user has no permission to read it), no common value can be determined.
   * @param parentIds The ids of the linked parent records to load
   * @param rule The inheritance rule
   * @param options.parentType The entity type of the parent records
   *   (ids of other types are not loaded, ids without type prefix are loaded as this type);
   *   if not given, each record is loaded as the type of its id prefix
   * @param options.loadedParents Further linked parents that are already loaded (not in parentIds)
   * @param options.changeSet Changes that are not saved yet, used instead of the saved records
   */
  public async loadCommonValue(
    parentIds: string[],
    rule: DefaultValueConfigInheritedField,
    options: {
      parentType?: EntityConstructor;
      loadedParents?: Entity[];
      changeSet?: ChangeSet;
    } = {},
  ): Promise<CommonValueOfParents> {
    const loaded = await this.loadEntitiesByIds(options.parentType, parentIds);
    // without all linked parents available, no shared value can be determined
    if (loaded.length !== parentIds.length) {
      return { noCommonValue: "unavailable" };
    }

    const parents = options.changeSet
      ? loaded.map((parent) => options.changeSet.get(parent, "after"))
      : loaded;
    const commonValue = this.calculateCommonValue(
      [...(options.loadedParents ?? []), ...parents],
      rule,
    );
    return commonValue.isConflict
      ? { noCommonValue: "conflict" }
      : { value: commonValue.value };
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
    return this.collectValues(
      await this.loadRecordsLinkingTo(
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        entity.getId(),
      ),
      rule,
    );
  }

  /** The values of the given records as defined by the automation rule, skipping duplicates (database format). */
  private collectValues(
    records: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): any[] {
    return records.reduce(
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
   * Load entities by their IDs, skipping those that cannot be loaded.
   * @param entityType The type of entities to load (ids of other types are skipped);
   *   if undefined, each entity is loaded as the type of its id prefix
   * @param entityIds
   */
  private async loadEntitiesByIds(
    entityType: EntityConstructor | undefined,
    entityIds: string[],
  ): Promise<Entity[]> {
    // The reference field can hold ids of several entity types. Ids without any type prefix
    // are still loaded, because the mapper adds the prefix of the given type itself.
    const idsToLoad = entityType
      ? entityIds.filter(
          (id) =>
            String(id).startsWith(`${entityType.ENTITY_TYPE}:`) ||
            !String(id).includes(":"),
        )
      : entityIds;

    const loadedEntities = await Promise.all(
      idsToLoad.map((id) => this.loadEntity(id, entityType)),
    );

    return loadedEntities.filter((entity) => entity);
  }

  /**
   * Load an entity, logging why it could not be loaded.
   * @param entityId
   * @param entityType The type of the entity; if not given, the type of the id prefix
   * @return the entity, or undefined if it could not be loaded
   */
  private async loadEntity(
    entityId: string,
    entityType?: EntityConstructor,
  ): Promise<Entity | undefined> {
    try {
      return await this.entityMapper.load(
        entityType ?? Entity.extractTypeFromId(entityId),
        entityId,
      );
    } catch (error) {
      const context = { entityType: entityType?.ENTITY_TYPE, entityId };
      const status = error?.["status"] ?? error?.["statusCode"];
      if (status === 401 || status === 403) {
        // the user simply has no read access to the linked entity - expected for some roles
        Logging.debug(
          "AutomatedFieldUpdateConfigService: No permission to load linked entity",
          context,
          error,
        );
      } else {
        Logging.warn(
          "AutomatedFieldUpdateConfigService: Failed to load linked entity",
          context,
          error,
        );
      }
      return undefined;
    }
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
   * Find the entities affected by the change and open a dialog to confirm their updates with the user.
   * Saves entities only if the user confirms the changes.
   * @return whether there were any affected entities
   */
  private async confirmAndSaveAffectedEntities(
    trigger: UpdateTrigger,
  ): Promise<boolean> {
    const affectedEntities = await this.findAffectedEntities(trigger);
    if (affectedEntities.length === 0) return false;

    const userConfirmed = await this.showConfirmationDialog(
      affectedEntities,
      trigger,
    );
    if (!userConfirmed) return true;

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
      // e.g. records only listed to note that their linked records have no value in common
      const changes = updates.filter(
        (update) => entity && !this.isCurrentValue(entity, update),
      );
      if (changes.length > 0) {
        changes.forEach((update) => {
          entity[update.targetFieldId] = update.newValue;
        });
        savePromises.push(this.entityMapper.save(entity));
      }
    });

    await Promise.all(savePromises);
    return true;
  }

  /**
   * Whether the confirmed new value is the value that the entity already has (compared in database format).
   */
  private isCurrentValue(entity: Entity, update: AffectedEntity): boolean {
    const toDatabaseFormat = (value: any) =>
      this.transformSourceValueToDatabaseFormat(
        value,
        entity,
        update.targetFieldId,
        this.entitySchemaService,
      );
    return isSameValue(
      toDatabaseFormat(update.newValue),
      toDatabaseFormat(entity[update.targetFieldId]),
    );
  }

  /**
   * Opens the confirmation dialog to let user to approve or update the changes.
   * @param entitiesToUpdate - List of entities with pending updates
   */
  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
    trigger: UpdateTrigger,
  ): Promise<AffectedEntity[] | null> {
    // loaded lazily to avoid a circular import (dialog -> field edit -> inherited value button -> this service)
    const { AutomatedFieldUpdateComponent } =
      await import("./automated-field-update.component");
    const dialogRef = this.dialog.open(AutomatedFieldUpdateComponent, {
      maxHeight: "90vh",
      data: {
        entities: entitiesToUpdate,
        trigger,
        recalculate: (enteredValues: EnteredValue[]) =>
          this.findAffectedEntities(trigger, enteredValues),
      },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }
}
