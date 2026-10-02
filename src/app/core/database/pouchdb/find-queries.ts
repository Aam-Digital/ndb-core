/** One page of results of a Mango query, with the bookmark to continue after it. */
export type FindPage = { docs: any[]; bookmark?: string };

/** A Mango query together with the index that serves it. */
export interface IndexedQuery {
  index: PouchDB.Find.CreateIndexOptions["index"];
  findOptions: PouchDB.Find.FindRequest<any>;
}

/**
 * Selector matching all documents of one entity type.
 * @param prefix the entity type, i.e. the prefix of its documents' ids
 */
export function typeSelector(prefix: string): PouchDB.Find.Selector {
  return { _id: { $lt: `${prefix}:￰`, $gte: `${prefix}:` } };
}

/**
 * The two queries that together return an entity type's documents sorted by a
 * property, in the order in which to page through them.
 *
 * A Mango index only contains the documents that have every indexed field
 * (and cannot be told to treat a missing one like `null`), so a query sorted
 * through an index on the property skips all documents without a value for it.
 * These are queried separately, through a partial index containing only them.
 *
 * @param prefix the entity type, i.e. the prefix of its documents' ids
 * @param query the Mango selector to filter by
 * @param sort the property and direction to sort by
 */
export function sortedQueries(
  prefix: string,
  query: PouchDB.Find.Selector,
  sort: { prop: string; dir?: "asc" | "desc" },
): [IndexedQuery, IndexedQuery] {
  const hasValue = { [sort.prop]: { $exists: true } };
  const hasNoValue = { [sort.prop]: { $exists: false } };

  const withValue: IndexedQuery = {
    // TODO delete indexes at one point? e.g. when column is removed
    index: {
      name: prefix + "_" + sort.prop,
      partial_filter_selector: typeSelector(prefix),
      fields: [sort.prop],
    },
    findOptions: {
      // no type range: already included in partial_filter_selector.
      // `hasValue` is implied by CouchDB's index, but PouchDB's local
      // engine does not skip docs without the sort property by itself
      selector: allOfSelectors(query, hasValue),
      sort: [{ [sort.prop]: sort.dir }],
    },
  };

  const withoutValue: IndexedQuery = {
    index: {
      name: prefix + "_" + sort.prop + "_missing",
      partial_filter_selector: { ...typeSelector(prefix), ...hasNoValue },
      fields: ["_id"],
    },
    findOptions: {
      // the type range also makes the `_id` index usable for this query.
      // Separate from the query, to keep any condition of its own on `_id`
      selector: allOfSelectors(query, typeSelector(prefix), hasNoValue),
    },
  };

  // like the in-memory table sort: docs without a value last for "asc", first for "desc"
  return sort.dir === "desc"
    ? [withoutValue, withValue]
    : [withValue, withoutValue];
}

/**
 * Combine Mango selectors so that a document has to match all of them,
 * leaving out empty ones (and the `$and` itself if only one is left).
 */
function allOfSelectors(
  ...selectors: PouchDB.Find.Selector[]
): PouchDB.Find.Selector {
  const parts = selectors.filter((s) => Object.keys(s).length > 0);
  return parts.length === 1 ? parts[0] : { $and: parts };
}
