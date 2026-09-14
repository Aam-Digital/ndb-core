import moment from "moment";
import { DataFilter } from "../../core/filter/filters/filters";
import { AuditRecord } from "./model/audit-record";
import {
  BASELINE_OPERATION,
  ChangeHistoryFilters,
  FILTERABLE_ACTION_OPERATIONS,
} from "./change-history.types";

/** sorts after every string, so it closes an `_id` prefix range */
const RANGE_END = "￰";

/** The whole of the selected end day is included, not just its midnight. */
export function endOfDay(to: Date): string {
  return moment(to).endOf("day").toISOString();
}

/**
 * The database selector for the change log's filter bar.
 *
 * Applied on top of the type range the entity layer adds, so it only has to
 * describe the filters themselves.
 */
export function buildAuditFilter(
  filters: ChangeHistoryFilters,
): DataFilter<AuditRecord> {
  const timestamp: Record<string, unknown> = {};
  if (filters.from) {
    timestamp.$gte = filters.from.toISOString();
  }
  if (filters.to) {
    timestamp.$lte = endOfDay(filters.to);
  }

  const selector: Record<string, unknown> = {
    // the sort field must be constrained for the index to be usable; a date
    // bound already does that, otherwise match any record that has a timestamp
    timestamp: Object.keys(timestamp).length > 0 ? timestamp : { $gt: null },
    // a baseline is not a change but a snapshot the system captured, written
    // with the same timestamp and author as the first real change to that
    // record - listing it would duplicate that change's row and attribute the
    // record's whole field list to whoever happened to edit it first.
    // `$ne` rather than a list of the wanted operations, so an operation added
    // later shows up instead of being silently dropped.
    operation: { $ne: BASELINE_OPERATION },
  };

  const operation = FILTERABLE_ACTION_OPERATIONS[filters.action];
  if (operation) {
    selector.operation = operation;
  }

  if (filters.entityType) {
    // a prefix range on the raw stored field. It is legal in a selector even
    // though AuditRecord declares no property of that name - see the class.
    selector.entityId = {
      $gte: `${filters.entityType}:`,
      $lt: `${filters.entityType}:${RANGE_END}`,
    };
  }

  if (filters.changedBy) {
    // the backend writes `user.name` only when the token carried one, so on
    // some systems every record identifies its author by id alone. The options
    // are sampled from the same fallback, so both have to be matched.
    selector.$or = [
      { "user.name": filters.changedBy },
      { "user.id": filters.changedBy },
    ];
  }

  return selector as DataFilter<AuditRecord>;
}
