import { isEqual, uniqWith, xorWith } from "lodash-es";
import { isEmptyValue } from "#src/app/utils/is-empty-value";

/**
 * The value that several values have in common.
 */
export interface CommonValue {
  /** the common value, undefined if all values are empty or if they differ */
  value: any;

  /** whether the (non-empty) values differ, so they have no value in common */
  isConflict: boolean;
}

/**
 * Whether two field values are the same, ignoring the order of items if both are arrays
 * (e.g. the selected options of a multi-select field), as well as duplicate items.
 * @param a a value in database format
 * @param b another value in the same format
 */
export function isSameValue(a: unknown, b: unknown): boolean {
  return Array.isArray(a) && Array.isArray(b)
    ? xorWith(a, b, isEqual).length === 0
    : isEqual(a, b);
}

/**
 * Get the value that all given values have in common, ignoring empty values
 * (and the order of items in array values, see {@link isSameValue}).
 * @param values the values to compare (all in the same format)
 */
export function getCommonValue(values: any[]): CommonValue {
  const distinctValues = uniqWith(
    values.filter((v) => !isEmptyValue(v)),
    isSameValue,
  );
  return {
    value: distinctValues.length === 1 ? distinctValues[0] : undefined,
    isConflict: distinctValues.length > 1,
  };
}
