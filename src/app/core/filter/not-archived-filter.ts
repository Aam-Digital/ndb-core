import { Entity } from "../entity/model/entity";
import { DataFilter } from "./filters/filters";

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
 *
 * Combined with `$and` instead of merged into the object, because the archived condition uses `$or`
 * and the given filter may already use `$or` itself, for example to cover several relation
 * properties. Merging would silently drop one of them.
 *
 * An empty filter is returned unwrapped, because an empty object as an `$and` branch makes a
 * database query match no document at all.
 */
export function restrictToNotArchived<T extends Entity>(
  filter: DataFilter<T>,
): DataFilter<T> {
  if (!filter || Object.keys(filter).length === 0) {
    return NOT_ARCHIVED_FILTER as DataFilter<T>;
  }

  return { $and: [NOT_ARCHIVED_FILTER, filter] } as DataFilter<T>;
}
