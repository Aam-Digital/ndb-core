import { isEqual, uniqWith } from "lodash-es";
import { isEmptyValue } from "./add-missing-values";

/**
 * Get the value that all given values have in common, ignoring empty values.
 * @param values the values to compare (all in the same format)
 * @return the common value or undefined if there is none, or if the values differ
 */
export function getCommonValue(values: any[]): any {
  const distinctValues = uniqWith(
    values.filter((v) => !isEmptyValue(v)),
    isEqual,
  );
  return distinctValues.length === 1 ? distinctValues[0] : undefined;
}
