import {
  buildAuthorSampleQuery,
  buildChangeLogQuery,
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
  expect(query.selector).toEqual({ timestamp: { $gt: null } });
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
