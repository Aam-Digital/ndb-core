/** One page of a Mango query, continuing from (and returning) an opaque bookmark. */
export type FindPage = { docs: any[]; bookmark?: string };

/** Runs one Mango query for the given page. */
export type RunFind = (
  findOptions: PouchDB.Find.FindRequest<any>,
  limit: number | undefined,
  bookmark: string | undefined,
) => Promise<FindPage>;

/** Creates a Mango index, or confirms that it already exists. */
export type CreateIndex = (
  index: PouchDB.Find.CreateIndexOptions,
) => Promise<PouchDB.Find.CreateIndexResponse<any>>;

/** Marks a bookmark of the second query, so the next page continues there. */
const SECOND_QUERY_BOOKMARK_PREFIX = "q2:";

/**
 * Selector matching all documents of one entity type.
 * @param prefix the entity type, i.e. the prefix of its documents' ids
 */
export function typeSelector(prefix: string): PouchDB.Find.Selector {
  return { _id: { $lt: `${prefix}:￰`, $gte: `${prefix}:` } };
}

/**
 * Query a page of an entity type's documents, sorted by a property.
 *
 * A Mango (json) index only contains the documents that have every indexed
 * field, so a query sorted through an index silently skips all documents
 * without a value for the sort property - and an index cannot be told to treat
 * a missing value like `null` instead. Those documents are therefore queried
 * separately, through a partial index containing only them, and this pages
 * through both queries one after the other as if they were a single one.
 *
 * Documents without a value come last for "asc" and first for "desc",
 * the same order as the in-memory table sort.
 *
 * The bookmark stays opaque to callers: a bookmark of the second query is
 * prefixed so that the next page continues there.
 *
 * @param db how the database creates an index and runs a single query
 * @param prefix the entity type, i.e. the prefix of its documents' ids
 * @param query the Mango selector to filter by
 * @param sort the property and direction to sort by
 * @param page the requested page; without a limit, both queries are run in full
 */
export async function findSorted(
  db: { createIndex: CreateIndex; runFind: RunFind },
  prefix: string,
  query: PouchDB.Find.Selector,
  sort: { prop: string; dir?: "asc" | "desc" },
  page?: { limit?: number; bookmark?: string },
): Promise<FindPage> {
  const sortedQuery = async (limit: number, bookmark: string) => {
    // TODO delete indexes at one point? e.g. when column is removed
    const index = await db.createIndex({
      index: {
        name: prefix + "_" + sort.prop,
        partial_filter_selector: typeSelector(prefix),
        fields: [sort.prop],
      },
    });
    return db.runFind(
      {
        // no type range: already included in partial_filter_selector.
        // `$exists` is implied by CouchDB's index, but PouchDB's local
        // engine does not skip docs without the sort property by itself
        selector: allOfSelectors(query, { [sort.prop]: { $exists: true } }),
        sort: [{ [sort.prop]: sort.dir }],
        // the installed @types/pouchdb-find does not declare `id`
        use_index: index["id"],
      },
      limit,
      bookmark,
    );
  };

  const missingQuery = async (limit: number, bookmark: string) => {
    const missingValue = { [sort.prop]: { $exists: false } };
    // only the docs without the sort property, so that this query does not
    // have to scan through all docs of the type to find them
    const index = await db.createIndex({
      index: {
        name: prefix + "_" + sort.prop + "_missing",
        partial_filter_selector: { ...typeSelector(prefix), ...missingValue },
        fields: ["_id"],
      },
    });
    return db.runFind(
      {
        // the type range also makes the `_id` index usable for this query
        selector: allOfSelectors(
          { ...query, ...typeSelector(prefix) },
          missingValue,
        ),
        // the installed @types/pouchdb-find does not declare `id`
        use_index: index["id"],
      },
      limit,
      bookmark,
    );
  };

  const queries =
    sort.dir === "desc"
      ? [missingQuery, sortedQuery]
      : [sortedQuery, missingQuery];

  let queryIndex = 0;
  let bookmark = page?.bookmark;
  if (bookmark?.startsWith(SECOND_QUERY_BOOKMARK_PREFIX)) {
    queryIndex = 1;
    bookmark = bookmark.slice(SECOND_QUERY_BOOKMARK_PREFIX.length) || undefined;
  }

  const limit = page?.limit;
  const res = await queries[queryIndex](limit, bookmark);
  if (queryIndex === 1) {
    return withSecondQueryBookmark(res);
  }

  const remaining = limit === undefined ? undefined : limit - res.docs.length;
  if (remaining !== undefined && remaining <= 0) {
    // the first query may have more: continue there on the next page
    return res;
  }

  // the first query is exhausted: fill up the page from the second one
  const next = await queries[1](remaining, undefined);
  return withSecondQueryBookmark({
    docs: [...res.docs, ...next.docs],
    bookmark: next.bookmark,
  });
}

function withSecondQueryBookmark(res: FindPage): FindPage {
  return {
    docs: res.docs,
    bookmark: SECOND_QUERY_BOOKMARK_PREFIX + (res.bookmark ?? ""),
  };
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
