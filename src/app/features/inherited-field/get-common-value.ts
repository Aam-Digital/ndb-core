import { isEqual, uniqWith } from "lodash-es";

/**
 * Whether the value is empty, i.e. not set or an empty text or list.
 */
export function isEmptyValue(value: any): boolean {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

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
