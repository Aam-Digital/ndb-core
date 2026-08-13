import moment from "moment";
import { Entity } from "../../core/entity/model/entity";
import { changedFieldsOf, RawAuditDoc } from "./change-history-normalize";
import {
  ChangeLogEntry,
  ChangeLogFilters,
  OPERATION_TO_ACTION,
} from "./change-history.types";

/**
 * A CouchDB Mango query, as sent to the audit database's `_find` endpoint.
 * See {@link https://docs.couchdb.org/en/stable/api/database/find.html}
 */
export interface MangoQuery {
  selector: Record<string, unknown>;
  sort?: Record<string, "asc" | "desc">[];
  fields?: string[];
  limit?: number;
  /** how many matches to pass over before the returned ones */
  skip?: number;
}

/**
 * The Mango index the change log sorts on. Created on demand (creating an index
 * twice is a no-op in CouchDB), because `sort` only works on an indexed field.
 */
export const AUDIT_TIMESTAMP_INDEX = {
  index: { fields: [{ timestamp: "desc" }] },
  name: "audit-timestamp",
  type: "json",
};

/**
 * The highest possible unicode character, terminating an id-prefix range.
 * (`Child:` .. `Child:￰` matches every id of type `Child`.)
 */
const RANGE_END = "￰";

/**
 * How many recent records the author filter's options are sampled from.
 * The audit database has no index of its authors, so the dropdown is built from
 * the newest records instead of the whole (unboundedly growing) history.
 */
export const AUTHOR_SAMPLE_SIZE = 1000;

/**
 * Build the query for one page of the system-wide change log.
 *
 * One more than a page is requested so the caller knows whether a further page
 * exists without guessing: a full page is otherwise indistinguishable from the
 * last page, which would offer a "next" that turns out empty.
 *
 * Paging is positional (`skip`) rather than by cursor. A cursor cannot answer
 * "is there more" without consuming the extra record it would then have to skip,
 * and positions stay correct when the user pages back and forth.
 *
 * Only the date bounds are served by {@link AUDIT_TIMESTAMP_INDEX}; entity type
 * and author are applied by CouchDB while it walks that index. Results are
 * correct either way, but a narrow filter over a long history means a longer
 * walk to fill a page.
 */
export function buildChangeLogQuery(
  filters: ChangeLogFilters,
  pageSize: number,
  pageIndex = 0,
): MangoQuery {
  return {
    selector: buildSelector(filters),
    sort: [{ timestamp: "desc" }],
    limit: pageSize + 1,
    skip: pageIndex * pageSize,
  };
}

function buildSelector(filters: ChangeLogFilters): Record<string, unknown> {
  const timestamp: Record<string, unknown> = {};
  if (filters.from) {
    timestamp.$gte = filters.from.toISOString();
  }
  if (filters.to) {
    // the picker yields a plain day for a manually typed date, so extend it to
    // that day's end; a preset range already ends there and is unaffected
    timestamp.$lte = moment(filters.to).endOf("day").toISOString();
  }

  const selector: Record<string, unknown> = {
    // the sort field must be constrained for the index to be usable; a date
    // bound already does that, otherwise match any record that has a timestamp
    timestamp: Object.keys(timestamp).length > 0 ? timestamp : { $gt: null },
  };

  if (filters.entityType) {
    selector.entityId = {
      $gte: `${filters.entityType}:`,
      $lt: `${filters.entityType}:${RANGE_END}`,
    };
  }
  if (filters.changedBy) {
    selector["user.name"] = filters.changedBy;
  }
  return selector;
}

/**
 * Build the query sampling the newest records for the author filter's options.
 *
 * `_id` is projected alongside `user` even though nothing displays it: the
 * backend derives a document's permission subject from its `_id` and drops any
 * doc that has none, so projecting `user` alone returns an empty list.
 */
export function buildAuthorSampleQuery(): MangoQuery {
  return {
    selector: { timestamp: { $gt: null } },
    sort: [{ timestamp: "desc" }],
    fields: ["_id", "user"],
    limit: AUTHOR_SAMPLE_SIZE,
  };
}

/**
 * Map a raw audit document to one displayable change-log row.
 *
 * Unlike the per-entity history, a row is derived from its own document alone;
 * see {@link changedFieldsOf}.
 */
export function toChangeLogEntry(doc: RawAuditDoc): ChangeLogEntry {
  const entityId = doc.entityId ?? "";
  const by = authorOf(doc) ?? "";
  return {
    id: doc._id,
    at: new Date(doc.timestamp),
    by,
    byEntityId: authorEntityId(by),
    action: OPERATION_TO_ACTION[doc.operation] ?? "updated",
    entityId,
    entityType: entityId ? Entity.extractTypeFromId(entityId) : "",
    changedFields: changedFieldsOf(doc),
  };
}

/** The distinct authors of the given records, sorted for a stable dropdown. */
export function distinctAuthors(docs: RawAuditDoc[]): string[] {
  const authors = new Set<string>();
  for (const doc of docs ?? []) {
    const author = authorOf(doc);
    if (author) {
      authors.add(author);
    }
  }
  return [...authors].sort((a, b) => a.localeCompare(b));
}

/** The recorded author's display name, falling back to their id. */
function authorOf(doc: RawAuditDoc): string | undefined {
  return doc.user?.name ?? doc.user?.id;
}

/**
 * The author as an entity id, when the backend recorded one (`User:demo-admin`)
 * rather than a bare username. Only then can the UI resolve a readable name;
 * anything else is displayed as the plain text it is.
 */
export function authorEntityId(author: string): string | undefined {
  return author?.includes(":") ? author : undefined;
}
