import { Entity } from "../entity/model/entity";
import { combineFilterConditions, DataFilter } from "./filters/filters";

/**
 * Select records that are not archived.
 *
 * The `inactive` flag is only written when a record gets archived, so for the vast majority of
 * records the property is missing entirely. A plain `{ inactive: { $ne: true } }` does not reliably
 * match those in a database query, so the missing case is spelled out as its own condition.
 */
export const NOT_ARCHIVED_FILTER = {
  $or: [{ inactive: { $ne: true } }, { inactive: { $exists: false } }],
};

/**
 * Restrict the given filter to records that are not archived.
 */
export function restrictToNotArchived<T extends Entity>(
  filter?: DataFilter<T>,
): DataFilter<T> {
  return combineFilterConditions<T>(NOT_ARCHIVED_FILTER, filter ?? {});
}
