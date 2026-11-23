import { Entity } from "#src/app/core/entity/model/entity";
import { asArray } from "#src/app/utils/asArray";

/**
 * Whether the record links to the given id in the given field
 * (also if the link is stored without the type prefix of the id).
 */
export function isLinkedTo(
  record: Entity | undefined,
  referenceField: string,
  id: string,
): boolean {
  return asArray(record?.[referenceField] ?? []).some(
    (linkedId) =>
      linkedId === id ||
      (!String(linkedId).includes(":") && id.endsWith(`:${linkedId}`)),
  );
}

/**
 * Whether the value of a field differs between the state of a record after and before a change
 * (after is undefined for a removed record).
 */
export function isFieldChanged(
  after: Entity | undefined,
  before: Entity,
  fieldId: string,
): boolean {
  return JSON.stringify(before[fieldId]) !== JSON.stringify(after?.[fieldId]);
}

/**
 * The ids of the fields whose value differs between the state of a record after and before a change
 * (all fields with a value for a removed record).
 */
export function getChangedFields(
  after: Entity | undefined,
  before: Entity,
): string[] {
  return [...before.getSchema().keys()].filter((fieldId) =>
    isFieldChanged(after, before, fieldId),
  );
}

/** The state of the records: as saved before the change, or with the change and the suggested values */
export type ChangeSetState = "before" | "after";

interface ChangedRecord {
  /** undefined for a new record */
  before: Entity | undefined;
  /** undefined for a removed record */
  after: Entity | undefined;
  changedFields: Set<string>;
  /** when the record was added, as the records linking to a record are listed in that order */
  order: number;
}

/**
 * The changed records of one type in one state, by the ids they link to in one field
 * (the linked ids as they are stored, so maybe without type prefix).
 */
interface LinkIndex {
  state: ChangeSetState;
  entityType: string;
  referenceField: string;
  recordIds: Map<string, Set<string>>;
}

/** A changed record that starts an update */
export interface StartingChange {
  /** the changed record (already saved) */
  entity: Entity;
  /** the changed record before the change */
  before: Entity;
  /** the fields of the changed record that are passed on */
  changedFields: string[];
  /** whether the record was removed (e.g. the discarded record of a merge), so it no longer links to any record */
  removed?: boolean;
}

/**
 * The records that an update changes: the changed records that started it, and the records with
 * a suggested value that is not saved yet. All other records are the same before and after the change.
 *
 * This allows to calculate the value of an affected record from all its linked records in both states,
 * instead of from the change of one linked record only.
 */
export class ChangeSet {
  private readonly records = new Map<string, ChangedRecord>();
  private nextOrder = 0;

  /**
   * The indexes of the records linking to a record, built when they are first needed and extended when a value is set,
   * so that a bulk edit with many changed records does not go through all of them for every affected record.
   * They only list the records that may link to a record: the records are checked again when they are looked up.
   */
  private readonly linkIndexes = new Map<string, LinkIndex>();

  /** Increases whenever a value is set, so that what is calculated from the records stays valid until then */
  version = 0;

  constructor(changes: StartingChange[]) {
    for (const { entity, before, changedFields, removed } of changes) {
      this.records.set(entity.getId(), {
        before: before.isNew ? undefined : before,
        // a copy, as suggested values for fields of the changed record are set here, and the record may be shown
        after: removed ? undefined : entity.copy(),
        changedFields: new Set(changedFields),
        order: this.nextOrder++,
      });
    }
  }

  /**
   * The record in the given state (the given record itself if it is not changed),
   * or undefined if the record did not exist before or was removed.
   */
  get(entity: Entity, state: ChangeSetState): Entity | undefined {
    const record = this.records.get(entity.getId());
    return record ? record[state] : entity;
  }

  /** Whether the record with the given id was removed */
  isRemoved(id: string): boolean {
    const record = this.records.get(id);
    return !!record && !record.after;
  }

  isChanged(entity: Entity, fieldId: string): boolean {
    return (
      this.records.get(entity.getId())?.changedFields.has(fieldId) ?? false
    );
  }

  /**
   * Set the value of a field for the state after the change.
   * @param saved the record as it is saved
   * @param fieldId the field to set
   * @param value the value in entity format
   * @param isSavedValue whether the value is the saved one, so that the field is not changed any more
   */
  setValue(
    saved: Entity,
    fieldId: string,
    value: unknown,
    isSavedValue: boolean,
  ): void {
    this.version++;
    const id = saved.getId();
    const record = this.records.get(id) ?? {
      before: saved,
      after: saved.copy(),
      changedFields: new Set<string>(),
      order: this.nextOrder++,
    };
    record.after[fieldId] = value;
    if (isSavedValue) {
      record.changedFields.delete(fieldId);
    } else {
      record.changedFields.add(fieldId);
    }

    if (record.changedFields.size > 0) {
      this.records.set(id, record);
      this.addToLinkIndexes(id, record);
    } else {
      this.records.delete(id);
    }
  }

  /**
   * The records of the given type that link to the given record in the given state.
   * @param saved the saved records that link to the record (from the database)
   * @param entityType the type of the linking records
   * @param referenceField the field of the linking records that holds the link
   * @param id the id of the record that is linked
   * @param state the state of the records
   */
  linkingTo(
    saved: Entity[],
    entityType: string,
    referenceField: string,
    id: string,
    state: ChangeSetState,
  ): Entity[] {
    const savedIds = new Set(saved.map((record) => record.getId()));
    const recordIds = this.getLinkIndex(state, entityType, referenceField);
    // a link can be stored without the type prefix of the id
    const candidateIds = new Set([
      ...(recordIds.get(id) ?? []),
      ...(recordIds.get(id.slice(id.lastIndexOf(":") + 1)) ?? []),
    ]);
    const otherChangedRecords = [...candidateIds]
      .filter((recordId) => !savedIds.has(recordId))
      .map((recordId) => this.records.get(recordId))
      // the indexes keep the records that are no longer changed or no longer linked
      .filter((record) => record)
      .sort((a, b) => a.order - b.order)
      .map((record) => record[state]);
    return [
      ...saved.map((record) => this.get(record, state)),
      ...otherChangedRecords,
    ].filter((record) => isLinkedTo(record, referenceField, id));
  }

  /** The changed records of the given type that link to the given record after the change */
  changedRecordsLinkingTo(
    entityType: string,
    referenceField: string,
    id: string,
  ): Entity[] {
    return this.linkingTo([], entityType, referenceField, id, "after");
  }

  private getLinkIndex(
    state: ChangeSetState,
    entityType: string,
    referenceField: string,
  ): Map<string, Set<string>> {
    const key = `${state}|${entityType}|${referenceField}`;
    let index = this.linkIndexes.get(key);
    if (!index) {
      index = { state, entityType, referenceField, recordIds: new Map() };
      this.linkIndexes.set(key, index);
      for (const [id, record] of this.records) {
        addToLinkIndex(index, id, record);
      }
    }
    return index.recordIds;
  }

  private addToLinkIndexes(id: string, record: ChangedRecord): void {
    for (const index of this.linkIndexes.values()) {
      addToLinkIndex(index, id, record);
    }
  }
}

function addToLinkIndex(
  index: LinkIndex,
  id: string,
  record: ChangedRecord,
): void {
  const entity = record[index.state];
  if (entity?.getType() !== index.entityType) return;

  for (const linkedId of asArray(entity[index.referenceField] ?? [])) {
    const key = String(linkedId);
    const recordIds = index.recordIds.get(key) ?? new Set<string>();
    recordIds.add(id);
    index.recordIds.set(key, recordIds);
  }
}
