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
 * The past-tense wording for each operation, shared by the badge and the
 * filter's options so the two cannot drift apart.
 */
export const OPERATION_LABELS: Record<ChangeOperation, string> = {
  baseline: $localize`:Change action badge:Initial snapshot`,
  create: $localize`:Change action badge:Created`,
  update: $localize`:Change action badge:Updated`,
  delete: $localize`:Change action badge:Deleted`,
};

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
 * Explanation for the synthetic "initial snapshot" entry, shown both inline in
 * its diff and as the badge tooltip (single source of truth).
 */
export const BASELINE_NOTE = $localize`:Change history baseline note:Record state captured when change logging was enabled. Edits made before this point aren't recorded.`;
