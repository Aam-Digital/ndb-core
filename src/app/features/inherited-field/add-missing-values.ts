import { differenceWith, isEqual, uniqWith } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";

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
 * Append the given values to the existing values, skipping any duplicates.
 * @param existingValues values already set (database format)
 * @param valuesToAdd new values to be added (database format)
 * @return the combined values or the unchanged existingValues if all values are already included
 */
export function addMissingValues(existingValues: any, valuesToAdd: any): any {
  const existing = asArray(existingValues ?? []);
  const missingValues = uniqWith(
    differenceWith(asArray(valuesToAdd ?? []), existing, isEqual),
    isEqual,
  );

  return missingValues.length > 0
    ? [...existing, ...missingValues]
    : existingValues;
}

/**
 * Add the given values to the existing values (skipping duplicates) and remove the values to remove.
 * @param existingValues values already set (database format)
 * @param valuesToAdd new values to be added (database format)
 * @param valuesToRemove values to be removed from the existing values (database format)
 * @return the combined values or the unchanged existingValues if nothing was added or removed
 */
export function addAndRemoveValues(
  existingValues: any,
  valuesToAdd: any,
  valuesToRemove: any[] = [],
): any {
  const combinedValues = addMissingValues(existingValues, valuesToAdd);
  const remainingValues = differenceWith(
    asArray(combinedValues ?? []),
    valuesToRemove,
    isEqual,
  );

  return remainingValues.length === asArray(combinedValues ?? []).length
    ? combinedValues
    : remainingValues;
}
