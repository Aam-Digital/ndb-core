/**
 * The kind of change an audit event represents. These are exactly the
 * operations emitted by the audit backend (replication-backend, issue #4026):
 * `create` -> `created`, `update` -> `updated`, `delete` -> `deleted`, plus the
 * synthetic `baseline` snapshot.
 *
 * (A future "edit-mode tag" may add `imported`/`merge`; until the backend emits
 * them, `actionMetaFor` falls back to `updated`.)
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
  from: any;
  /** new raw value */
  to: any;
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

export interface ActionMeta {
  /** FontAwesome (solid) icon name, resolved via app-fa-dynamic-icon */
  icon: string;
  label: string;
  /** badge background color */
  background: string;
  /** badge text/icon color */
  color: string;
}

/**
 * Display metadata per action. Orange is reserved for app chrome, so even
 * `imported` uses an orange-tint background with deep-orange text — never the
 * brand primary fill.
 */
export const ACTION_META: Record<ChangeAction, ActionMeta> = {
  baseline: {
    icon: "flag",
    label: $localize`:Change action badge:Baseline`,
    background: "#ECEFF1",
    color: "#4a525c",
  },
  created: {
    icon: "circle-plus",
    label: $localize`:Change action badge:Created`,
    background: "#E6F4EA",
    color: "#1E6C33",
  },
  updated: {
    icon: "pen-to-square",
    label: $localize`:Change action badge:Updated`,
    background: "#CCEFFF",
    color: "#1565C0",
  },
  deleted: {
    icon: "trash",
    label: $localize`:Change action badge:Deleted`,
    background: "#FBE2DE",
    color: "#B23A2C",
  },
};

/**
 * Resolve display metadata for an action, falling back to `updated` for any
 * unknown action.
 */
export function actionMetaFor(action: ChangeAction): ActionMeta {
  return ACTION_META[action] ?? ACTION_META.updated;
}
