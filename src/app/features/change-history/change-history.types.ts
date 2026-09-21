/**
 * The kind of change an audit event represents, named exactly as the audit
 * backend emits it, so the stored value is also the one displayed and filtered
 * on. Only the badge's wording is past tense, which is a label rather than a
 * second vocabulary to map back and forth.
 *
 * (A future "edit-mode tag" may add `imported`/`merge`; until the backend emits
 * them, the badge falls back to `update`.)
 */
export const CHANGE_OPERATIONS = [
  "baseline",
  "create",
  "update",
  "delete",
] as const;

export type ChangeOperation = (typeof CHANGE_OPERATIONS)[number];

/**
 * The backend `operation` of a baseline record: the full-snapshot anchor written
 * alongside the first audited change of a pre-existing record, so that record's
 * history has a starting state to replay from.
 *
 * It is not a change anyone made, which is why the change *log* excludes it (see
 * `buildChangeHistoryQuery`) while the per-record history still builds on it.
 */
export const BASELINE_OPERATION = "baseline";

/**
 * The operations a user can filter the change log by, in the order the filter
 * offers them.
 *
 * `baseline` is deliberately absent: the log never lists snapshots, so offering
 * it would only ever return nothing (see `buildChangeHistoryQuery`).
 */
export const FILTERABLE_OPERATIONS: ChangeOperation[] = [
  "create",
  "update",
  "delete",
];

/**
 * A single field's before/after, in raw database format (enum ids, ISO date
 * strings, entity-reference ids — hydrated for display via the schema, see
 * RecordDiffComponent).
 */
export interface FieldChange {
  field: string;
  /** previous raw value; empty/undefined for additions (created/baseline) */
  from: unknown;
  /** new raw value */
  to: unknown;
}

/**
 * One normalized change-history entry for an entity, derived from a raw audit
 * document.
 */
export interface ChangeEvent {
  /** the audit document `_id` */
  id: string;
  /** server-set time of the change */
  at: Date;
  /** authenticated author (user-entity id or name) recorded by the backend */
  by: string;
  operation: ChangeOperation;
  /** changed fields; empty for `delete`, all-additions for `create`/`baseline` */
  changes: FieldChange[];
  /** optional contextual note (e.g. the baseline explanation) */
  note?: string;
}

/**
 * One row of the system-wide change log: a single audited write, across all
 * records rather than within one entity's history.
 *
 * Carries only what the list displays. The field-level before/after is
 * deliberately absent: that needs the entity's full replayed state (see
 * `buildChangeEvents`), which the per-record change-history dialog provides.
 */
export interface ChangeHistoryEntry {
  /** the audit document `_id` */
  id: string;
  /** server-set time of the change */
  at: Date;
  /**
   * authenticated author recorded by the backend (name, or id as fallback).
   * This is the raw recorded value, and what the author filter matches on.
   */
  by: string;
  /**
   * {@link by} as an entity id, when the author was recorded as an app user
   * record; unset for a plain username, which has no record to resolve.
   */
  byEntityId?: string;
  operation: ChangeOperation;
  /** the changed record's id, e.g. `Child:123` */
  entityId: string;
  /** the changed record's type prefix, e.g. `Child` */
  entityType: string;
  /** names of the fields this write changed; empty for a delete */
  changedFields: string[];
}

/**
 * The active filters of the system-wide change log. An unset property means
 * "no restriction" on that dimension.
 */
export interface ChangeHistoryFilters {
  /** entity type prefix, e.g. `Child` */
  entityType?: string;
  /** author, matched against the recorded user name */
  changedBy?: string;
  /** only one kind of change; see {@link FILTERABLE_OPERATIONS}. */
  operation?: ChangeOperation;
  /**
   * a record id, e.g. `User:1`: only changes *related* to that record — changes
   * to the record itself, and changes to any other record that referenced it
   * (a `Note`'s `authors` gaining or losing `User:1`).
   *
   * Served by a dedicated view rather than the log's default query, so it cannot
   * be combined with {@link entityType} or {@link changedBy}; those are ignored
   * (and disabled in the UI) while this is set.
   */
  relatedEntityId?: string;
  /** only changes at or after this time */
  from?: Date;
  /** only changes up to this time (the whole day is included) */
  to?: Date;
}

/**
 * Explanation for the synthetic "initial snapshot" entry, shown both inline in
 * its diff and as the badge tooltip (single source of truth).
 */
export const BASELINE_NOTE = $localize`:Change history baseline note:Record state captured when change logging was enabled. Edits made before this point aren't recorded.`;
