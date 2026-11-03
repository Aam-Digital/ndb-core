import { Entity } from "../entity/model/entity";
import { EmbeddedFieldRef } from "../entity/schema/embedded-schema-field.util";
import { createEmptyValueFilter, DataFilter } from "./filters/filters";

/**
 * Adapt a condition built for the full id of a property nested inside an embedded field
 * (e.g. "childrenAttendance.participant"), as if it were a normal, flat field,
 * into a condition that matches against the outer, embedding field instead:
 * - if the outer field holds an array of embedded objects, using `$elemMatch`
 *   (e.g. `{ childrenAttendance: { $elemMatch: { participant: id } } }`,
 *   matching if *any* of the entries has this value)
 * - if the outer field holds a single embedded object, using a flat dot-path query
 *   (e.g. `{ "phoneNumber.type": "mobile" }`)
 */
export function conditionOnEmbeddedField<T extends Entity>(
  query: DataFilter<T> | undefined,
  fieldId: string,
  embedded: EmbeddedFieldRef,
): DataFilter<T> | undefined {
  if (!query || Object.keys(query).length === 0) {
    return query;
  }

  if (!embedded.isArray) {
    return rewriteEmbeddedKeys(
      query,
      fieldId,
      `${embedded.outerProp}.${embedded.innerProp}`,
    ) as DataFilter<T>;
  }

  const rewritten = rewriteEmbeddedKeys(query, fieldId, embedded.innerProp);
  return wrapInElemMatch<T>(rewritten, embedded.outerProp);
}

/**
 * The "not defined" condition for a property nested inside an embedded field.
 * For a list of embedded entries, a record counts as "not defined" if it has no entries at all,
 * or if at least one of its entries does not have a value for this property.
 */
export function emptyValueFilterOfEmbeddedField<T extends Entity>(
  embedded: EmbeddedFieldRef,
  includeNestedId = false,
): DataFilter<T> {
  const innerIsArray = embedded.innerSchema.isArray === true;
  if (!embedded.isArray) {
    return createEmptyValueFilter<T>(
      `${embedded.outerProp}.${embedded.innerProp}`,
      includeNestedId,
      innerIsArray,
    );
  }

  const innerEmpty = createEmptyValueFilter<T>(
    embedded.innerProp,
    includeNestedId,
    innerIsArray,
  );
  return {
    $or: [
      { [embedded.outerProp]: { $exists: false } },
      { [embedded.outerProp]: { $size: 0 } },
      wrapInElemMatch<T>(innerEmpty, embedded.outerProp),
    ],
  } as DataFilter<T>;
}

/**
 * Wrap a per-item query in `$elemMatch` to match against an array field, matching if *any*
 * item satisfies it - hoisting a top-level `$or` out of `$elemMatch` first (e.g. turning
 * `{ $elemMatch: { $or: [A, B] } }` into `{ $or: [{ $elemMatch: A }, { $elemMatch: B }] }`),
 * since a compound operator like `$or` directly inside `$elemMatch` is not supported by the
 * mongo2js query parser used here. Both forms are logically equivalent for `$elemMatch`
 * (an item matching A-or-B exists iff an item matching A exists, or one matching B exists).
 * The same goes for `$and`, which cannot be hoisted that way: a filter with several conditions on one item
 * has to state them as keys of one object instead (see the overlap query of `DateFilter`).
 */
function wrapInElemMatch<T extends Entity>(
  query: any,
  outerProp: string,
): DataFilter<T> {
  if (query && typeof query === "object" && Array.isArray(query.$or)) {
    return {
      $or: query.$or.map((branch: any) =>
        wrapInElemMatch<T>(branch, outerProp),
      ),
    } as DataFilter<T>;
  }
  return { [outerProp]: { $elemMatch: query } } as DataFilter<T>;
}

/**
 * Recursively replace `fromKey` with `toKey` in the keys of a DataFilter query object,
 * also where it starts a path into the value (e.g. `fromKey + ".id"` of configurable-enum values,
 * or `fromKey + ".start"` of a date range).
 */
function rewriteEmbeddedKeys(query: any, fromKey: string, toKey: string): any {
  if (Array.isArray(query)) {
    return query.map((q) => rewriteEmbeddedKeys(q, fromKey, toKey));
  }
  if (query && typeof query === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(query)) {
      const newKey =
        key === fromKey || key.startsWith(`${fromKey}.`)
          ? toKey + key.substring(fromKey.length)
          : key;
      result[newKey] = rewriteEmbeddedKeys(value, fromKey, toKey);
    }
    return result;
  }
  return query;
}
