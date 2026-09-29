import { describe, expect, it, vi } from "vitest";
import type { Couchdb } from "../lib/couchdb-client.js";
import {
  deleteOrphanedAttachments,
  findOrphanedAttachments,
} from "./cleanup-attachments.js";

function makeStubCouchdb(opts: {
  attachmentRows?: { id: string; value: { rev: string } }[];
  entityIds?: string[];
}): Couchdb {
  const attachmentRows = opts.attachmentRows ?? [];
  const entityRows = (opts.entityIds ?? []).map((id) => ({ id }));
  return {
    get: vi.fn((path: string) =>
      path.startsWith("/app-attachments")
        ? Promise.resolve(attachmentRows)
        : Promise.resolve(entityRows),
    ),
    putAll: vi.fn().mockResolvedValue([]),
  } as unknown as Couchdb;
}

describe("findOrphanedAttachments", () => {
  it("returns attachment docs whose entity no longer exists in app", async () => {
    const couchdb = makeStubCouchdb({
      attachmentRows: [
        { id: "Child:1", value: { rev: "3-abc" } },
        { id: "Child:2", value: { rev: "5-def" } },
      ],
      entityIds: ["Child:1"],
    });

    const result = await findOrphanedAttachments(couchdb);

    expect(result).toEqual([{ _id: "Child:2", _rev: "5-def" }]);
  });

  it("returns an empty array when every attachment doc has a matching entity", async () => {
    const couchdb = makeStubCouchdb({
      attachmentRows: [{ id: "Child:1", value: { rev: "3-abc" } }],
      entityIds: ["Child:1"],
    });

    const result = await findOrphanedAttachments(couchdb);

    expect(result).toEqual([]);
  });
});

describe("deleteOrphanedAttachments", () => {
  it("bulk-deletes the given orphans from app-attachments", async () => {
    const couchdb = makeStubCouchdb({});

    await deleteOrphanedAttachments(couchdb, [
      { _id: "Child:2", _rev: "5-def" },
    ]);

    expect(couchdb.putAll).toHaveBeenCalledWith(
      [{ _id: "Child:2", _rev: "5-def", _deleted: true }],
      "app-attachments",
    );
  });

  it("does nothing when there are no orphans", async () => {
    const couchdb = makeStubCouchdb({});

    await deleteOrphanedAttachments(couchdb, []);

    expect(couchdb.putAll).not.toHaveBeenCalled();
  });
});
