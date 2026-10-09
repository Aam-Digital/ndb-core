import { differenceWith, isEqual, uniqWith } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";

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
