import { isEqual, uniqWith } from "lodash-es";

/**
 * Get the value that all given values have in common, ignoring empty values.
 * @param values the values to compare (all in the same format)
 * @return the common value or undefined if there is none, or if the values differ
 */
export function getCommonValue(values: any[]): any {
  const filledValues = values.filter(
    (v) => !(v == null || v === "" || (Array.isArray(v) && v.length === 0)),
  );
  const distinctValues = uniqWith(filledValues, isEqual);
  return distinctValues.length === 1 ? distinctValues[0] : undefined;
}
