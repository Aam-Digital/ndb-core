import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";
import { differenceWith, isEqual, uniq } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";
import { addAndRemoveValues, isEmptyValue } from "../add-missing-values";
import { isSameValue } from "../get-common-value";
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
} from "../inherited-field-config";
import {
  AffectedEntity,
  AffectedRule,
  CommonValueOfParents,
  EnteredValue,
  UpdateTrigger,
} from "./automated-field-update.types";
import {
  ChangeSet,
  ChangeSetState,
  getChangedFields,
  isLinkedTo,
} from "./change-set";

/** Number of levels above the changed entity that are included in one update dialog. */
export const MAX_HIERARCHY_LEVELS = 10;

/** Safety limit for the calculation of the affected entities, in case their values do not settle (e.g. in a loop) */
const MAX_STEPS = 1000;

/** An entity whose fields changed, so that the entities based on them have to be calculated (again) */
export interface QueuedChange {
  /** the entity as it is saved */
  entity: Entity;
  /** how many levels above the changed entity it is (0 = the changed entity itself) */
  level: number;
  changedFields: string[];
  /** the field of the changed entity that this change is based on (not set for the changed entity itself) */
  sourceFieldId?: string;
  /** only update the entities that the entity links to (not the ones linking to it) */
  onlyLinkedEntities?: boolean;
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

/** The suggested update of an affected entity, before it is known on which path(s) and level the entity is reached */
type Suggestion = Omit<AffectedEntity, "level" | "via" | "sourceFieldId">;

/** What the calculation needs from the service: the rules, the records and the permissions */
export interface AffectedEntitiesContext {
  /** The rules that pass on the changed fields of the source entity */
  getTriggeredRules(source: Entity, change: QueuedChange): AffectedRule[];

  /** Whether the user may change the field of the entity */
  canUpdate(entity: Entity, fieldId: string): boolean;

  /** The value of the field of the entity in database format */
  getDatabaseValue(entity: Entity, fieldId: string): any;

  /** A value of a field of the entity type, converted from database format to entity format */
  toEntityFormat(
    value: unknown,
    entityType: EntityConstructor,
    fieldId: string,
  ): unknown;

  /** The records of the type that reference the entity in the field (a single reference or a list of references) */
  loadRecordsLinkingTo(
    entityType: string | EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]>;

  /** The entities with the given ids, skipping those that cannot be loaded */
  loadEntitiesByIds(
    entityType: EntityConstructor | undefined,
    entityIds: string[],
  ): Promise<Entity[]>;

  /** The value that the linked parent records have in common */
  loadCommonValue(
    parentIds: string[],
    rule: DefaultValueConfigInheritedField,
    options?: {
      parentType?: EntityConstructor;
      loadedParents?: Entity[];
      changeSet?: ChangeSet;
    },
  ): Promise<CommonValueOfParents>;

  /** The values of the given records as defined by the rule, skipping duplicates (database format) */
  collectValues(
    records: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): any[];

  /** The new value from the source entity with the value mapping of the rule applied (database format) */
  calculateNewValue(
    sourceEntity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): any;
}

/** The ids of the entities that the entity links to in the reference field of the rule */
function getLinkedIds(
  entity: Entity | undefined,
  rule: DefaultValueConfigInheritedField,
): string[] {
  const referencedIds = entity?.[rule.sourceReferenceField];
  return referencedIds ? asArray(referencedIds) : [];
}

/**
 * One calculation of the entities that an update affects, level by level up the hierarchy
 * (e.g. the school of a child and the parent school of that school).
 *
 * The value of each entity is calculated from all its linked records, with the changes found so far
 * (see {@link ChangeSet}). Whenever an entity gets another value, the entities based on it are calculated again.
 * So the result does not depend on the order or the number of paths over which an entity is reached.
 *
 * It collects its result while it runs, so use a new instance for each calculation.
 */
export class AffectedEntitiesCalculation {
  private readonly changedFields: string[];

  /** the changed entity and the entities with a suggested value, which the entities above are calculated from */
  private readonly changeSet: ChangeSet;

  /** the affected entities found so far, by entity id and field */
  private readonly affectedEntities = new Map<string, AffectedEntity>();

  /**
   * The saved records loaded so far, by what was loaded. The saved records do not change during the calculation,
   * so they are loaded only once, also if many changed records lead to the same entity (e.g. all children of a school).
   */
  private readonly loadedRecords = new Map<string, Promise<Entity[]>>();

  /**
   * @param context the rules, records and permissions that the calculation works with
   * @param trigger the change that starts the update
   * @param enteredValues values the user entered for affected entities (database format),
   *   which the entities above are based on instead of the suggestions
   */
  constructor(
    private readonly context: AffectedEntitiesContext,
    private readonly trigger: UpdateTrigger,
    private readonly enteredValues: EnteredValue[] = [],
  ) {
    this.changedFields = trigger.fieldId
      ? [trigger.fieldId]
      : getChangedFields(trigger.entity, trigger.before);
    this.changeSet = new ChangeSet(
      trigger.entity,
      trigger.before,
      this.changedFields,
    );
  }

  /**
   * Find the affected entities.
   * @return the affected entities, ordered by level
   */
  async run(): Promise<AffectedEntity[]> {
    const queue: QueuedChange[] = [
      {
        entity: this.trigger.entity,
        level: 0,
        changedFields: this.changedFields,
        onlyLinkedEntities: !!this.trigger.fieldId,
      },
    ];

    let steps = 0;
    while (queue.length > 0) {
      if (steps++ >= MAX_STEPS) {
        Logging.warn(
          "AutomatedFieldUpdateConfigService: Stopped looking for affected entities after the maximum number of steps",
          { entityType: this.trigger.entity.getType() },
        );
        break;
      }
      const change = queue.shift();
      if (change.level >= MAX_HIERARCHY_LEVELS) continue;

      const source = this.changeSet.get(change.entity, "after");
      for (const rule of this.context.getTriggeredRules(source, change)) {
        const next = {
          level: change.level + 1,
          // the entities above are based on the field that the change started with
          sourceFieldId: change.sourceFieldId ?? rule.rule.sourceValueField,
        };
        for (const target of await this.loadTargets(rule, source)) {
          if (await this.updateSuggestion(target, rule, source, next)) {
            queue.push({
              ...next,
              entity: target,
              changedFields: [rule.fieldId],
            });
          }
        }
      }
    }

    return [...this.affectedEntities.values()].sort(
      (a, b) => a.level - b.level,
    );
  }

  /**
   * Calculate the suggested value of the target again and use it (or the value the user entered)
   * for the entities above.
   * @param level how many levels above the changed entity the target is reached
   * @param sourceFieldId the field of the changed entity that the update of the target is based on
   * @return whether the target got another value, so that the entities based on it have to be calculated again
   */
  private async updateSuggestion(
    target: Entity,
    rule: AffectedRule,
    source: Entity,
    { level, sourceFieldId }: Pick<QueuedChange, "level" | "sourceFieldId">,
  ): Promise<boolean> {
    // the field that was changed is never offered again, and the chain ends at an entity the user may not update
    const isChangedField =
      target.getId() === this.trigger.entity.getId() &&
      this.changedFields.includes(rule.fieldId);
    if (isChangedField || !this.context.canUpdate(target, rule.fieldId)) {
      return false;
    }

    const key = `${target.getId()}|${rule.fieldId}`;
    const existing = this.affectedEntities.get(key);
    const suggestion = await this.suggestValue(target, rule, source);
    if (suggestion) {
      this.affectedEntities.set(key, {
        ...suggestion,
        level: Math.max(level, existing?.level ?? 0),
        via: uniq([...(existing?.via ?? []), source.getId()]),
        // an entity that is reached over several paths stays with the field of the first one
        sourceFieldId: existing?.sourceFieldId ?? sourceFieldId,
      });
    } else {
      this.affectedEntities.delete(key);
    }

    const entered = this.enteredValues.find(
      (e) => e.id === target.getId() && e.targetFieldId === rule.fieldId,
    );
    const value = entered
      ? entered.value
      : (suggestion?.newValue ??
        this.context.getDatabaseValue(target, rule.fieldId));
    return this.setPendingValue(target, rule, value);
  }

  /**
   * Load the entities that the rule would update when the source entity changes.
   * @param source the changed entity (after the change)
   * @return the affected entities as they are saved
   */
  private async loadTargets(
    { rule, entityType }: AffectedRule,
    source: Entity,
  ): Promise<Entity[]> {
    if (!rule.sourceReferenceEntity) {
      return this.loadRecordsLinkingTo(
        entityType,
        rule.sourceReferenceField,
        source.getId(),
      );
    }
    // the entities linked before and after the change (they may lose values)
    const ids = uniq([
      ...getLinkedIds(source, rule),
      ...getLinkedIds(this.changeSet.get(source, "before"), rule),
    ]);
    return this.loadOnce(`ids|${entityType.ENTITY_TYPE}|${ids.join(",")}`, () =>
      this.context.loadEntitiesByIds(entityType, ids),
    );
  }

  /** The saved records of the type that reference the entity in the field (see {@link loadedRecords}) */
  private loadRecordsLinkingTo(
    entityType: string | EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]> {
    const typeName =
      typeof entityType === "string" ? entityType : entityType.ENTITY_TYPE;
    return this.loadOnce(
      `linking|${typeName}|${referenceField}|${entityId}`,
      () =>
        this.context.loadRecordsLinkingTo(entityType, referenceField, entityId),
    );
  }

  private loadOnce(
    key: string,
    load: () => Promise<Entity[]>,
  ): Promise<Entity[]> {
    if (!this.loadedRecords.has(key)) {
      this.loadedRecords.set(key, load());
    }
    return this.loadedRecords.get(key);
  }

  /**
   * Use the given value of the affected entity (database format) for the entities above it.
   * @return whether the entity got another value, so that the entities based on it have to be calculated again
   */
  private setPendingValue(
    target: Entity,
    { entityType, fieldId }: AffectedRule,
    value: unknown,
  ): boolean {
    const pendingValue = this.context.getDatabaseValue(
      this.changeSet.get(target, "after"),
      fieldId,
    );
    if (isSameValue(pendingValue, value)) return false;

    this.changeSet.setValue(
      target,
      fieldId,
      this.context.toEntityFormat(value, entityType, fieldId),
      isSameValue(this.context.getDatabaseValue(target, fieldId), value),
    );
    return true;
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
  ): Promise<Suggestion | undefined> {
    const { rule, entityType, fieldId } = affectedRule;
    let newValue: NewValue | undefined;
    if (!rule.sourceReferenceEntity) {
      newValue = await this.loadNewValue(target, affectedRule, source);
    } else if (isCollectingFromLinkedRecords(entityType.schema.get(fieldId))) {
      newValue = await this.loadCollectedValue(target, affectedRule);
    } else {
      newValue = this.getValueOfChangedRecord(target, rule);
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
  ): Promise<NewValue> {
    const linkingTo = (saved: Entity[], state: ChangeSetState) =>
      this.changeSet.linkingTo(
        saved,
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        target.getId(),
        state,
      );
    const changedRecords = linkingTo([], "after");
    const changedValues = this.context.collectValues(changedRecords, rule);
    const lostValues = differenceWith(
      this.context.collectValues(linkingTo([], "before"), rule),
      changedValues,
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
          this.context.collectValues(linkingTo(saved, "after"), rule),
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
        this.context.getDatabaseValue(target, fieldId),
        changedValues,
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
  ): NewValue | undefined {
    const source = this.changeSet
      .changedRecordsLinkingTo(
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        target.getId(),
      )
      .find(
        (record) =>
          this.changeSet.isChanged(record, rule.sourceValueField) ||
          (!isLinkedTo(
            this.changeSet.get(record, "before"),
            rule.sourceReferenceField,
            target.getId(),
          ) &&
            !isEmptyValue(this.context.calculateNewValue(record, rule))),
      );
    return source
      ? { value: this.context.calculateNewValue(source, rule) }
      : undefined;
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
      return { value: this.context.calculateNewValue(sourceEntity, rule) };
    }

    const { value, noCommonValue } = await this.context.loadCommonValue(
      otherIds,
      rule,
      {
        parentType: sourceEntity.getConstructor(),
        loadedParents: [sourceEntity],
        // the changes are used instead of the saved values
        changeSet: this.changeSet,
      },
    );

    if (noCommonValue) {
      return {
        value: this.context.getDatabaseValue(targetEntity, fieldId),
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
  ): Suggestion | undefined {
    // compare in database format, as the loaded entity holds e.g. enum objects instead of ids
    const currentValue = this.context.getDatabaseValue(
      targetEntity,
      targetFieldId,
    );
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
      savedValue: currentValue,
      targetFieldId,
      targetEntityType,
      selectedField: { ...fieldConfig, id: targetFieldId },
      affectedEntity: targetEntity,
      relatedReferenceField: rule.sourceReferenceField,
      relatedReferenceFieldEntityType: rule.sourceReferenceEntity
        ? sourceEntity.getConstructor()
        : targetEntityType,
      addToExisting: isCollectingFromLinkedRecords(fieldConfig),
      noCommonValue: shownNoCommonValue,
      unlinked: unlinked || undefined,
    };
  }
}
