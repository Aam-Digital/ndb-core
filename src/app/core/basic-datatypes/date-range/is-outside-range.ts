import moment from "moment";
import { DateRangeValue } from "./date-range.datatype";

/**
 * Whether the range goes beyond the outer range (compared by day).
 *
 * A missing date leaves the range open on that side (e.g. no end date = ongoing),
 * so it goes beyond an outer range that has a date on that side.
 * An empty range or outer range never counts as outside.
 */
export function isOutsideRange(
  range: DateRangeValue | undefined,
  outer: DateRangeValue | undefined,
): boolean {
  if (!range?.start && !range?.end) {
    return false;
  }
  const startsBefore =
    !!outer?.start &&
    (!range.start || moment(range.start).isBefore(outer.start, "day"));
  const endsAfter =
    !!outer?.end && (!range.end || moment(range.end).isAfter(outer.end, "day"));
  return startsBefore || endsAfter;
}
