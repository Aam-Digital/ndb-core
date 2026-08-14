import {
  buildAuthorSampleQuery,
  buildChangeLogQuery,
  buildReferenceViewQuery,
  distinctAuthors,
  toChangeLogEntry,
} from "./change-log-query";
import { RawAuditDoc } from "./change-history-normalize";

function doc(partial: Partial<RawAuditDoc>): RawAuditDoc {
  return {
    _id: "AuditRecord:Child:1:2026-06-03T10:00:00.000Z:2-b",
    entityId: "Child:1",
    operation: "update",
    timestamp: "2026-06-03T10:00:00.000Z",
    rev: "2-b",
    user: { id: "kc-1", name: "demo-admin" },
    ...partial,
  };
}

it("queries the newest records first, restricted to docs that have a timestamp", () => {
  const query = buildChangeLogQuery({}, 25);
  expect(query.sort).toEqual([{ timestamp: "desc" }]);
  // an index-usable "field exists" condition, required for the sort to use the index
  expect(query.selector).toEqual({
    timestamp: { $gt: null },
    operation: { $ne: "baseline" },
  });
});

it("excludes the baseline snapshot, which would duplicate the change it anchors", () => {
  // a baseline carries the timestamp and author of the first real change to
  // that record, so listing both shows the same record twice at the same second
  expect(buildChangeLogQuery({}, 25).selector.operation).toEqual({
    $ne: "baseline",
  });
});

it("asks for one record beyond the page, to tell a full page from the last one", () => {
  const query = buildChangeLogQuery({}, 25);
  expect(query.limit).toBe(26);
  expect(query.skip).toBe(0);
});

it("skips the preceding pages to fetch a later one", () => {
  const query = buildChangeLogQuery({}, 10, 3);
  expect(query.skip).toBe(30);
  expect(query.limit).toBe(11);
});

it("filters by entity type as an id prefix range", () => {
  expect(buildChangeLogQuery({ entityType: "School" }, 10).selector).toEqual({
    timestamp: { $gt: null },
    operation: { $ne: "baseline" },
    entityId: { $gte: "School:", $lt: "School:￰" },
  });
});

it("filters by author and by a lower date bound", () => {
  expect(
    buildChangeLogQuery(
      { changedBy: "demo-admin", from: new Date("2026-06-01T00:00:00.000Z") },
      10,
    ).selector,
  ).toEqual({
    timestamp: { $gte: "2026-06-01T00:00:00.000Z" },
    operation: { $ne: "baseline" },
    "user.name": "demo-admin",
  });
});

it("extends the upper date bound to the end of that day", () => {
  const selector: any = buildChangeLogQuery(
    { to: new Date("2026-06-30T00:00:00.000Z") },
    10,
  ).selector;
  // a plain day as the "to" input must still include that day's own changes
  const end = new Date(selector.timestamp.$lte);
  expect(end.getHours()).toBe(23);
  expect(end.getMinutes()).toBe(59);
  expect(end.getDate()).toBe(30);
});

it("walks one referenced id's key range backwards, for the same newest-first order", () => {
  const query = buildReferenceViewQuery({ relatedEntityId: "User:1" }, 25);
  expect(query.descending).toBe(true);
  // `{}` sorts after every string, `["User:1"]` before every ["User:1", ...]
  expect(query.startkey).toEqual(["User:1", {}]);
  expect(query.endkey).toEqual(["User:1"]);
});

it("always includes the docs, which is what the backend permission-filters on", () => {
  expect(
    buildReferenceViewQuery({ relatedEntityId: "User:1" }, 25),
  ).toHaveProperty("include_docs", true);
});

it("pages the reference view like the change log, one row beyond the page", () => {
  const query = buildReferenceViewQuery({ relatedEntityId: "User:1" }, 10, 3);
  expect(query.limit).toBe(11);
  expect(query.skip).toBe(30);
});

it("narrows the reference key range by the date filter", () => {
  const query = buildReferenceViewQuery(
    {
      relatedEntityId: "User:1",
      from: new Date("2026-06-01T00:00:00.000Z"),
      to: new Date("2026-06-30T00:00:00.000Z"),
    },
    10,
  );
  // descending: the upper bound starts the walk, the lower one ends it
  const upper = new Date(query.startkey[1] as string);
  expect(upper.getDate()).toBe(30);
  expect(upper.getHours()).toBe(23);
  expect(query.endkey).toEqual(["User:1", "2026-06-01T00:00:00.000Z"]);
});

it("maps an audit doc to a log entry with its entity type and changed fields", () => {
  expect(
    toChangeLogEntry(
      doc({ operation: "update", diff: { name: ["A", "B"], updated: {} } }),
    ),
  ).toEqual({
    id: "AuditRecord:Child:1:2026-06-03T10:00:00.000Z:2-b",
    at: new Date("2026-06-03T10:00:00.000Z"),
    by: "demo-admin",
    byEntityId: undefined,
    action: "updated",
    entityId: "Child:1",
    entityType: "Child",
    changedFields: ["name"],
  });
});

it("falls back to the user id, and to no entity type, when either is missing", () => {
  const entry = toChangeLogEntry(
    doc({ entityId: undefined, user: { id: "kc-9" } }),
  );
  expect(entry.by).toBe("kc-9");
  expect(entry.entityId).toBe("");
  expect(entry.entityType).toBe("");
});

it("keeps _id in the author sample, which the proxy requires to return a doc at all", () => {
  // the backend drops every doc without an _id from a _find response, so a
  // projection of just "user" comes back empty
  expect(buildAuthorSampleQuery().fields).toEqual(["_id", "user"]);
});

it("spends the author sample on real changes, not on baselines repeating their author", () => {
  expect(buildAuthorSampleQuery().selector.operation).toEqual({
    $ne: "baseline",
  });
});

it("exposes an app user author as an entity id, and a plain username as text only", () => {
  expect(toChangeLogEntry(doc({ user: { name: "User:demo-admin" } })).by).toBe(
    "User:demo-admin",
  );
  expect(
    toChangeLogEntry(doc({ user: { name: "User:demo-admin" } })).byEntityId,
  ).toBe("User:demo-admin");
  expect(toChangeLogEntry(doc({ user: { name: "importer" } })).byEntityId).toBe(
    undefined,
  );
});

it("lists the distinct authors of the sampled records, sorted", () => {
  expect(
    distinctAuthors([
      doc({ user: { id: "kc-2", name: "priya" } }),
      doc({ user: { id: "kc-1", name: "demo-admin" } }),
      doc({ user: { id: "kc-2", name: "priya" } }),
      doc({ user: { id: "kc-3" } }),
      doc({ user: undefined }),
    ]),
  ).toEqual(["demo-admin", "kc-3", "priya"]);
});
