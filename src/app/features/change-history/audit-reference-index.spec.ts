import { buildAuditReferenceIndex } from "./audit-reference-index";
import { RawAuditDoc } from "./change-history-normalize";

/**
 * Run the shipped map source against a document and collect the emitted keys.
 *
 * The view is evaluated from the design document itself rather than from a
 * TypeScript copy of the logic, so this covers the code CouchDB actually runs.
 */
function emittedKeys(doc: Partial<RawAuditDoc>): [string, string][] {
  const keys: [string, string][] = [];
  const map = new Function(
    "emit",
    `return (${buildAuditReferenceIndex().views.by_reference.map});`,
  )((key: [string, string]) => keys.push(key));
  map(doc);
  return keys;
}

/** the referenced ids the view indexes the given document under */
function referencedIds(doc: Partial<RawAuditDoc>): string[] {
  return emittedKeys(doc).map(([id]) => id);
}

function doc(partial: Partial<RawAuditDoc>): Partial<RawAuditDoc> {
  return {
    _id: "AuditRecord:Note:1:2026-06-03T10:00:00.000Z:2-b",
    entityId: "Note:1",
    operation: "update",
    timestamp: "2026-06-03T10:00:00.000Z",
    ...partial,
  };
}

it("indexes a record under its own id, so its own history is found too", () => {
  expect(referencedIds(doc({ diff: {} }))).toEqual(["Note:1"]);
});

it("emits the timestamp as the second key part, to page in date order", () => {
  expect(emittedKeys(doc({ diff: {} }))).toEqual([
    ["Note:1", "2026-06-03T10:00:00.000Z"],
  ]);
});

it("indexes a reference added to a multi-value field", () => {
  // jsondiffpatch encodes an array addition as a single-element array
  const added = doc({ diff: { authors: { 1: ["User:1"], _t: "a" } } });
  expect(referencedIds(added)).toEqual(["Note:1", "User:1"]);
});

it("indexes a reference removed from a multi-value field", () => {
  // ...and a removal as [oldValue, 0, 0] under an underscore-prefixed index
  const removed = doc({ diff: { authors: { _1: ["User:1", 0, 0], _t: "a" } } });
  expect(referencedIds(removed)).toEqual(["Note:1", "User:1"]);
});

it("indexes both sides of a replaced single reference", () => {
  const replaced = doc({ diff: { relatedChild: ["Child:1", "Child:2"] } });
  expect(referencedIds(replaced)).toEqual(["Note:1", "Child:1", "Child:2"]);
});

it("indexes references from a create snapshot", () => {
  const created = doc({
    operation: "create",
    diff: [{ _id: "Note:1", authors: ["User:1"], children: ["Child:7"] }],
  });
  expect(referencedIds(created)).toEqual(["Note:1", "User:1", "Child:7"]);
});

it("skips a baseline snapshot, which references without changing anything", () => {
  // its whole field list would report every record that merely held a reference
  // when logging was switched on as having changed it
  const baseline = doc({
    operation: "baseline",
    diff: { _id: "Note:1", authors: ["User:1"] },
  });
  expect(referencedIds(baseline)).toEqual([]);
});

it("indexes a delete under its own id only, as its content is not recorded", () => {
  const deleted = doc({ operation: "delete", diff: { _deleted: [true] } });
  expect(referencedIds(deleted)).toEqual(["Note:1"]);
});

it("emits each referenced id once, however often the record mentions it", () => {
  const repeated = doc({
    diff: { authors: { 1: ["User:1"] }, assignedTo: ["User:1"] },
  });
  expect(referencedIds(repeated)).toEqual(["Note:1", "User:1"]);
});

it("matches camelCase entity types, as created through the admin UI", () => {
  const custom = doc({ diff: { linked: ["myCustomType:1"] } });
  expect(referencedIds(custom)).toContain("myCustomType:1");
});

it("ignores values that merely contain a colon", () => {
  const noise = doc({
    diff: {
      subject: ["Meeting: about the plan"],
      date: ["2026-06-03T10:00:00.000Z"],
      time: ["10:30"],
      link: ["https://example.com/x"],
      contact: ["mailto:someone@example.com"],
    },
  });
  expect(referencedIds(noise)).toEqual(["Note:1"]);
});

it("skips a document without a timestamp, which could not be ordered", () => {
  expect(referencedIds({ entityId: "Note:1", diff: {} })).toEqual([]);
});

it("caps how many references one document contributes", () => {
  const many: Record<string, string> = {};
  for (let i = 0; i < 600; i++) {
    many[`field${i}`] = `Child:${i}`;
  }
  expect(referencedIds(doc({ diff: many }))).toHaveLength(500);
});

it("does not treat inherited object properties as already-seen references", () => {
  const collision = doc({ diff: { a: ["constructor:1"], b: ["toString:2"] } });
  expect(referencedIds(collision)).toEqual([
    "Note:1",
    "constructor:1",
    "toString:2",
  ]);
});
