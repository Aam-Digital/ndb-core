import {
  allInterpreters,
  allParsingInstructions,
  compare,
  createFactory,
  Filter,
} from "@ucast/mongo2js";
import moment from "moment";
import type { MongoQuery } from "@casl/ability";
import type { DataFilter } from "../core/filter/filters/filters";

const createPredicate = createFactory(allParsingInstructions, allInterpreters, {
  compare: extendedCompare,
}) as Filter;

/**
 * The in-memory engine for conditions (see the README of the filter module):
 * a function telling whether a record matches the given condition.
 * Throws if the condition cannot be parsed.
 *
 * Kept here, outside of `FilterService`, so that `Entity` can use it without a circular dependency.
 */
export function createFilterPredicate<T>(
  condition: DataFilter<T> | undefined,
): (record: T) => boolean {
  return createPredicate<T>((condition ?? {}) as MongoQuery<T>);
}

/**
 * Whether a part of a condition is an object of operators or nested conditions,
 * as opposed to a value to compare with (like a `Date`, a list or `null`).
 */
export function isPlainObject(value: unknown): value is Record<string, any> {
  return (
    !!value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Handles special cases like ConfigurableEnum objects and Dates.
 * Used for filter evaluation and conditional color matching.
 *
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function extendedCompare<T>(a: T, b: T): 1 | -1 | 0 {
  // Date comparisons, also of a day stored as string with a `Date` in the condition
  if (
    (a instanceof Date && typeof b === "string") ||
    (typeof a === "string" && b instanceof Date)
  ) {
    return compareDates(a, b);
  }

  // ConfigurableEnum comparisons (object with id property vs string)
  const aId = (a as any)?.id;
  const bId = (b as any)?.id;
  if (aId && typeof b === "string") {
    return aId === b ? 0 : aId < b ? -1 : 1;
  }
  if (bId && typeof a === "string") {
    return bId === a ? 0 : a < bId ? -1 : 1;
  }

  // Default comparison
  return compare(a, b);
}

/**
 * Compare dates at day precision
 */
function compareDates(a: Date | string, b: Date | string): 1 | -1 | 0 {
  const [momentA, momentB] = [moment(a), moment(b)];
  if (momentA.isSame(momentB, "days")) {
    return 0;
  } else if (momentA.isBefore(momentB, "days")) {
    return -1;
  } else {
    return 1;
  }
}
