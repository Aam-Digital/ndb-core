import { patch } from "jsondiffpatch";
import { isEqual } from "lodash-es";
import {
  BASELINE_NOTE,
  ChangeEvent,
  FieldChange,
  OPERATION_TO_ACTION,
} from "./change-history.types";

/**
 * The raw audit document as written by the replication-backend (issue #4026)
 * into the `<db>-audit` database.
 */
export interface RawAuditDoc {
  _id: string;
  entityId: string;
  database?: string;
  operation: "create" | "update" | "delete" | "baseline";
  rev?: string;
  parentRev?: string;
  timestamp: string;
  user?: { id?: string; name?: string; roles?: string[] };
  /**
   * For `update`: a jsondiffpatch delta. For `baseline`: the full previous
   * document. For `create`: a whole-value add (`[doc]`). For `delete`: a
   * structural delta (no displayable field pairs).
   */
  diff?: any;
}

/** Doc fields that are internal/metadata and never shown as user-facing field changes. */
const HIDDEN_FIELDS = new Set([
  "_id",
  "_rev",
  "_revisions",
  "created",
  "updated",
]);

function isHidden(field: string): boolean {
  return field.startsWith("_") || HIDDEN_FIELDS.has(field);
}

/**
 * Build the displayable change history for one entity from its raw audit docs.
 *
 * A jsondiffpatch update-delta only encodes *what changed* (e.g. items added to
 * an array by index), not the full prior value — so per-field before/after
 * cannot be read from a single delta. Instead the full document state is
 * replayed: starting from the `create`/`baseline` snapshot and applying each
 * update delta in chronological order, the before/after of every field
 * (including multi-value arrays) is the difference between consecutive full
 * states.
 *
 * @returns events newest-first
 */
export function buildChangeEvents(rawDocs: RawAuditDoc[]): ChangeEvent[] {
  const ordered = [...(rawDocs ?? [])].sort(byChronology);
  let state: Record<string, any> = {};
  const events: ChangeEvent[] = [];

  for (const doc of ordered) {
    const action = OPERATION_TO_ACTION[doc.operation] ?? "updated";
    const base = {
      id: doc._id,
      at: new Date(doc.timestamp),
      by: doc.user?.name ?? doc.user?.id ?? "",
      action,
    };

    if (doc.operation === "baseline" || doc.operation === "create") {
      const snapshot = snapshotOf(doc);
      state = { ...snapshot };
      events.push({
        ...base,
        changes: additions(snapshot),
        note: action === "baseline" ? BASELINE_NOTE : undefined,
      });
    } else if (doc.operation === "delete") {
      events.push({ ...base, changes: [] });
    } else {
      const next = applyDelta(state, doc.diff);
      events.push({ ...base, changes: fieldChanges(state, next) });
      state = next;
    }
  }

  return events.reverse();
}

/** chronological: by server timestamp, then by revision generation */
function byChronology(a: RawAuditDoc, b: RawAuditDoc): number {
  const byTime =
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  return byTime !== 0 ? byTime : revGeneration(a.rev) - revGeneration(b.rev);
}

function revGeneration(rev?: string): number {
  return rev ? parseInt(rev.split("-")[0], 10) || 0 : 0;
}

/** the full document snapshot carried by a baseline (raw doc) or create (`[doc]`) record */
function snapshotOf(doc: RawAuditDoc): Record<string, any> {
  const full =
    doc.operation === "create" && Array.isArray(doc.diff)
      ? doc.diff[0]
      : doc.diff;
  return full && typeof full === "object" ? full : {};
}

/** apply a jsondiffpatch delta to a deep clone of the current state */
function applyDelta(
  state: Record<string, any>,
  delta: any,
): Record<string, any> {
  if (!delta) {
    return state;
  }
  try {
    return patch(structuredClone(state), delta) as Record<string, any>;
  } catch {
    // a delta that doesn't cleanly apply (e.g. a missing-ancestor branch) must
    // not break the whole history — keep the prior state for this step
    return state;
  }
}

/** every (non-hidden) field of a snapshot rendered as an addition */
function additions(snapshot: Record<string, any>): FieldChange[] {
  return Object.keys(snapshot)
    .filter((field) => !isHidden(field))
    .map((field) => ({ field, from: undefined, to: snapshot[field] }));
}

/** the (non-hidden) fields whose full value differs between two states */
function fieldChanges(
  prev: Record<string, any>,
  next: Record<string, any>,
): FieldChange[] {
  const fields = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changes: FieldChange[] = [];
  for (const field of fields) {
    if (isHidden(field)) {
      continue;
    }
    if (!isEqual(prev[field], next[field])) {
      changes.push({ field, from: prev[field], to: next[field] });
    }
  }
  return changes;
}
