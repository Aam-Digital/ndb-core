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

/** The state of the records: as saved before the change, or with the change and the suggested values */
export type ChangeSetState = "before" | "after";

interface ChangedRecord {
  /** undefined for a new record */
  before: Entity | undefined;
  after: Entity;
  changedFields: Set<string>;
}

/**
 * The records that an update changes: the changed record that started it, and the records with
 * a suggested value that is not saved yet. All other records are the same before and after the change.
 *
 * This allows to calculate the value of an affected record from all its linked records in both states,
 * instead of from the change of one linked record only.
 */
export class ChangeSet {
  private readonly records = new Map<string, ChangedRecord>();

  /**
   * @param entity the changed record (already saved)
   * @param before the changed record before the change
   * @param changedFields the fields of the changed record that are passed on
   */
  constructor(entity: Entity, before: Entity, changedFields: string[]) {
    this.records.set(entity.getId(), {
      before: before.isNew ? undefined : before,
      after: entity,
      changedFields: new Set(changedFields),
    });
  }

  /**
   * The record in the given state (the given record itself if it is not changed),
   * or undefined if the record did not exist before.
   */
  get(entity: Entity, state: ChangeSetState): Entity | undefined {
    const record = this.records.get(entity.getId());
    return record ? record[state] : entity;
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
    const id = saved.getId();
    const record = this.records.get(id) ?? {
      before: saved,
      after: saved.copy(),
      changedFields: new Set<string>(),
    };
    record.after[fieldId] = value;
    if (isSavedValue) {
      record.changedFields.delete(fieldId);
    } else {
      record.changedFields.add(fieldId);
    }

    if (record.changedFields.size > 0) {
      this.records.set(id, record);
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
    const otherChangedRecords = [...this.records.values()]
      .map((record) => record[state])
      .filter(
        (record) =>
          record?.getType() === entityType && !savedIds.has(record.getId()),
      );
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
}
