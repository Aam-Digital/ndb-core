import { isEqual, uniqWith } from "lodash-es";
import { isEmptyValue } from "./add-missing-values";

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
 * Get the value that all given values have in common, ignoring empty values.
 * @param values the values to compare (all in the same format)
 */
export function getCommonValue(values: any[]): CommonValue {
  const distinctValues = uniqWith(
    values.filter((v) => !isEmptyValue(v)),
    isEqual,
  );
  return {
    value: distinctValues.length === 1 ? distinctValues[0] : undefined,
    isConflict: distinctValues.length > 1,
  };
}
