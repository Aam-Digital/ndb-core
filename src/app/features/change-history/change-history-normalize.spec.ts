import { buildChangeEvents, RawAuditDoc } from "./change-history-normalize";
import { BASELINE_NOTE } from "./change-history.types";

function doc(partial: Partial<RawAuditDoc>): RawAuditDoc {
  return {
    _id: `AuditRecord:Child:1:${partial.timestamp}:${partial.rev}`,
    entityId: "Child:1",
    operation: "update",
    timestamp: "2026-06-03T10:00:00.000Z",
    rev: "2-b",
    user: { id: "kc-1", name: "User:demo-admin" },
    ...partial,
  };
}

it("sets server timestamp, authenticated user and action", () => {
  const [event] = buildChangeEvents([
    doc({ operation: "create", rev: "1-a", diff: [{ name: "A" }] }),
  ]);
  expect(event.at).toEqual(new Date("2026-06-03T10:00:00.000Z"));
  expect(event.by).toBe("User:demo-admin");
  expect(event.action).toBe("created");
});

it("renders a create record as all-field additions", () => {
  const [event] = buildChangeEvents([
    doc({
      operation: "create",
      rev: "1-a",
      diff: [{ _id: "Child:1", name: "Asha", gender: "F" }],
    }),
  ]);
  expect(event.changes).toEqual([
    { field: "name", from: undefined, to: "Asha" },
    { field: "gender", from: undefined, to: "F" },
  ]);
});

it("renders a baseline as additions with the baseline note", () => {
  const [event] = buildChangeEvents([
    doc({
      operation: "baseline",
      rev: "5-x",
      diff: { _id: "Child:1", created: { at: "t", by: "U" }, name: "Asha" },
    }),
  ]);
  expect(event.action).toBe("baseline");
  expect(event.note).toBe(BASELINE_NOTE);
  expect(event.changes).toEqual([
    { field: "name", from: undefined, to: "Asha" },
  ]);
});

it("replays a scalar update to full before -> after", () => {
  const [event] = buildChangeEvents([
    doc({
      operation: "create",
      rev: "1-a",
      timestamp: "2026-06-03T10:00:00.000Z",
      diff: [{ gender: "M" }],
    }),
    doc({
      operation: "update",
      rev: "2-b",
      timestamp: "2026-06-03T11:00:00.000Z",
      diff: { gender: ["M", "X"] },
    }),
  ]);
  // newest first
  expect(event.action).toBe("updated");
  expect(event.changes).toEqual([{ field: "gender", from: "M", to: "X" }]);
});

it("shows the full prior array when an item is appended to a multi-value field", () => {
  const events = buildChangeEvents([
    doc({
      operation: "create",
      rev: "1-a",
      timestamp: "2026-06-03T10:00:00.000Z",
      diff: [{ center: ["alipore"] }],
    }),
    doc({
      operation: "update",
      rev: "2-b",
      timestamp: "2026-06-03T11:00:00.000Z",
      // jsondiffpatch array delta: insert "tollygunge" at index 1
      diff: { center: { _t: "a", "1": ["tollygunge"] } },
    }),
  ]);
  // newest event is the append; before must be the full prior array, not empty
  expect(events[0].changes).toEqual([
    { field: "center", from: ["alipore"], to: ["alipore", "tollygunge"] },
  ]);
});

it("shows removal from a multi-value field", () => {
  const events = buildChangeEvents([
    doc({
      operation: "create",
      rev: "1-a",
      timestamp: "2026-06-03T10:00:00.000Z",
      diff: [{ center: ["alipore", "tollygunge"] }],
    }),
    doc({
      operation: "update",
      rev: "2-b",
      timestamp: "2026-06-03T11:00:00.000Z",
      // remove index 0 ("alipore")
      diff: { center: { _t: "a", _0: ["alipore", 0, 0] } },
    }),
  ]);
  expect(events[0].changes).toEqual([
    { field: "center", from: ["alipore", "tollygunge"], to: ["tollygunge"] },
  ]);
});

it("ignores internal/metadata fields in update changes", () => {
  const events = buildChangeEvents([
    doc({
      operation: "create",
      rev: "1-a",
      timestamp: "2026-06-03T10:00:00.000Z",
      diff: [{ name: "A" }],
    }),
    doc({
      operation: "update",
      rev: "2-b",
      timestamp: "2026-06-03T11:00:00.000Z",
      diff: { name: ["A", "B"], updated: { at: ["t1", "t2"] } },
    }),
  ]);
  expect(events[0].changes).toEqual([{ field: "name", from: "A", to: "B" }]);
});

it("renders a delete as structural (no field changes)", () => {
  const [event] = buildChangeEvents([
    doc({ operation: "delete", rev: "3-c", diff: { _deleted: [true] } }),
  ]);
  expect(event.action).toBe("deleted");
  expect(event.changes).toEqual([]);
});

it("orders events newest-first", () => {
  const events = buildChangeEvents([
    doc({
      rev: "1-a",
      timestamp: "2026-06-01T10:00:00.000Z",
      operation: "create",
      diff: [{ name: "A" }],
    }),
    doc({
      rev: "3-c",
      timestamp: "2026-06-03T10:00:00.000Z",
      diff: { name: ["B", "C"] },
    }),
    doc({
      rev: "2-b",
      timestamp: "2026-06-02T10:00:00.000Z",
      diff: { name: ["A", "B"] },
    }),
  ]);
  expect(events.map((e) => e.at.toISOString())).toEqual([
    "2026-06-03T10:00:00.000Z",
    "2026-06-02T10:00:00.000Z",
    "2026-06-01T10:00:00.000Z",
  ]);
});
