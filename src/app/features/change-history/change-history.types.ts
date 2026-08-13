/**
 * The kind of change an audit event represents. These are exactly the
 * operations emitted by the audit backend (replication-backend, issue #4026):
 * `create` -> `created`, `update` -> `updated`, `delete` -> `deleted`, plus the
 * synthetic `baseline` snapshot.
 *
 * (A future "edit-mode tag" may add `imported`/`merge`; until the backend emits
 * them, the action badge falls back to `updated`.)
 */
export type ChangeAction = "baseline" | "created" | "updated" | "deleted";

/**
 * Maps the backend audit `operation` to the displayed {@link ChangeAction}.
 */
export const OPERATION_TO_ACTION: Record<string, ChangeAction> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  baseline: "baseline",
};

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
  action: ChangeAction;
  /** changed fields; empty for `deleted`, all-additions for `created`/`baseline` */
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
export interface ChangeLogEntry {
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
  action: ChangeAction;
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
export interface ChangeLogFilters {
  /** entity type prefix, e.g. `Child` */
  entityType?: string;
  /** author, matched against the recorded user name */
  changedBy?: string;
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
