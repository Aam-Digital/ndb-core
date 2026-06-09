import { describe, expect, it, vi } from "vitest";
import type { Couchdb } from "../lib/couchdb-client.js";
import { editEntities, searchEntities } from "./search-and-replace.js";

function makeStubCouchdb(docs: unknown[]): Couchdb {
  return {
    getAll: vi.fn().mockResolvedValue(docs),
    put: vi.fn().mockResolvedValue({}),
  } as unknown as Couchdb;
}

describe("searchEntities", () => {
  it("returns _ids of documents whose JSON contains the regex match", async () => {
    const docs = [
      { _id: "Child:1", name: "Alice" },
      { _id: "Child:2", name: "Bob" },
      { _id: "Child:3", name: "Alice-clone" },
    ];
    const couchdb = makeStubCouchdb(docs);

    const result = await searchEntities(couchdb, "Alice", "Child");

    expect(result).toEqual(["Child:1", "Child:3"]);
  });

  it("uses regex match (not simple substring)", async () => {
    const docs = [
      { _id: "Note:1", subject: "test-123" },
      { _id: "Note:2", subject: "test-abc" },
    ];
    const couchdb = makeStubCouchdb(docs);

    const result = await searchEntities(couchdb, "test-\\d+", "Note");

    expect(result).toEqual(["Note:1"]);
  });

  it("passes type to getAll for prefix filtering", async () => {
    const couchdb = makeStubCouchdb([]);
    await searchEntities(couchdb, "foo", "Child");
    expect(couchdb.getAll).toHaveBeenCalledWith("Child");
  });

  it("returns empty array when no docs match", async () => {
    const couchdb = makeStubCouchdb([{ _id: "Child:1", name: "Alice" }]);
    const result = await searchEntities(couchdb, "nonexistent", "Child");
    expect(result).toEqual([]);
  });
});

describe("editEntities", () => {
  it("dry-run returns changed doc _ids without calling put", async () => {
    const docs = [
      { _id: "Child:1", name: "old-value" },
      { _id: "Child:2", name: "other" },
    ];
    const couchdb = makeStubCouchdb(docs);

    const result = await editEntities(
      couchdb,
      "old-value",
      "new-value",
      "Child",
      true,
    );

    expect(result).toEqual([{ _id: "Child:1" }]);
    expect(couchdb.put).not.toHaveBeenCalled();
  });

  it("real run calls put exactly once per matched doc", async () => {
    const docs = [
      { _id: "Child:1", name: "old-value" },
      { _id: "Child:2", name: "old-value too" },
      { _id: "Child:3", name: "unrelated" },
    ];
    const couchdb = makeStubCouchdb(docs);

    const result = await editEntities(
      couchdb,
      "old-value",
      "new-value",
      "Child",
      false,
    );

    expect(result).toEqual([{ _id: "Child:1" }, { _id: "Child:2" }]);
    expect(couchdb.put).toHaveBeenCalledTimes(2);
    expect(couchdb.put).toHaveBeenCalledWith(
      "/app/Child:1",
      expect.objectContaining({ name: "new-value" }),
    );
    expect(couchdb.put).toHaveBeenCalledWith(
      "/app/Child:2",
      expect.objectContaining({ name: "new-value too" }),
    );
  });

  it("supports regex replacement patterns", async () => {
    const docs = [{ _id: "Child:1", ref: "entity:123:abc" }];
    const couchdb = makeStubCouchdb(docs);

    await editEntities(
      couchdb,
      "entity:(\\w+):(\\w+)",
      "entity:$2:$1",
      "Child",
      false,
    );

    expect(couchdb.put).toHaveBeenCalledWith(
      "/app/Child:1",
      expect.objectContaining({ ref: "entity:abc:123" }),
    );
  });

  it("returns empty array when no docs match", async () => {
    const couchdb = makeStubCouchdb([{ _id: "Child:1", name: "fine" }]);
    const result = await editEntities(
      couchdb,
      "nonexistent",
      "x",
      "Child",
      false,
    );
    expect(result).toEqual([]);
    expect(couchdb.put).not.toHaveBeenCalled();
  });

  it("fails before writing if any transformed JSON is invalid", async () => {
    const docs = [
      { _id: "Child:1", name: "ok" },
      { _id: "Child:2", name: "break-me" },
    ];
    const couchdb = makeStubCouchdb(docs);

    await expect(
      editEntities(couchdb, '"name":"break-me"', '"name":"unterminated', "Child", false),
    ).rejects.toThrow();

    expect(couchdb.put).not.toHaveBeenCalled();
  });
});
