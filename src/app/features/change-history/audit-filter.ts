import {
  DataFilter,
  FilterSelectionOption,
} from "../../core/filter/filters/filters";
import { AuditRecord } from "./model/audit-record";
import {
  BASELINE_OPERATION,
  ChangeOperation,
  FILTERABLE_OPERATIONS,
  OPERATION_LABELS,
} from "./change-history.types";

/** sorts after every string, so it closes an `_id` prefix range */
const RANGE_END = "￰";

/**
 * The part of the change log's query that is not the user's to choose.
 *
 * Applied under every filter selection rather than as one of the options, so
 * clearing the filters cannot widen it.
 */
export const AUDIT_BASE_FILTER: DataFilter<AuditRecord> = {
  // naming the sort field keeps the query self-describing: it says which index
  // answers it. Not strictly required - the data source pins `use_index`, and
  // CouchDB serves the sort from it even with the field unconstrained - so this
  // is documentation more than necessity
  timestamp: { $gt: null },
  // a baseline is not a change but a snapshot the system captured, written with
  // the same timestamp and author as the first real change to that record -
  // listing it would duplicate that change's row and attribute the record's
  // whole field list to whoever happened to edit it first.
  // `$ne` rather than a list of the wanted operations, so an operation added
  // later shows up instead of being silently dropped.
  operation: { $ne: BASELINE_OPERATION },
} as DataFilter<AuditRecord>;

/**
 * One filter option per entity type, each selecting that type's records by a
 * prefix range on the raw stored id.
 *
 * It is legal in a selector even though AuditRecord declares no property of
 * that name - see the class.
 */
export function entityTypeFilterOptions(
  types: { key: string; label: string }[],
): FilterSelectionOption<AuditRecord>[] {
  return types.map(({ key, label }) => ({
    key,
    label,
    filter: {
      entityId: { $gte: `${key}:`, $lt: `${key}:${RANGE_END}` },
    } as DataFilter<AuditRecord>,
  }));
}

/** One filter option per operation the log lets the user narrow to. */
export function operationFilterOptions(): FilterSelectionOption<AuditRecord>[] {
  return FILTERABLE_OPERATIONS.map((operation: ChangeOperation) => ({
    key: operation,
    label: OPERATION_LABELS[operation],
    filter: { operation } as DataFilter<AuditRecord>,
  }));
}

/**
 * One filter option per recorded author.
 *
 * The backend writes `user.name` only when the token carried one, so on some
 * systems every record identifies its author by id alone. The options are
 * sampled from the same fallback, so both have to be matched.
 */
export function authorFilterOptions(
  authors: string[],
): FilterSelectionOption<AuditRecord>[] {
  return authors.map((author) => ({
    key: author,
    label: author,
    filter: {
      $or: [{ "user.name": author }, { "user.id": author }],
    } as DataFilter<AuditRecord>,
  }));
}
