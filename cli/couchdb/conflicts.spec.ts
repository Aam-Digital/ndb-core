import { describe, expect, it, vi } from "vitest";
import type { Couchdb } from "../lib/couchdb-client.js";
import { getConflicts } from "./conflicts.js";

function makeStubCouchdb(opts: {
  getRejects?: boolean;
  viewRows?: { value: string }[];
}): Couchdb {
  const viewRows = opts.viewRows ?? [];
  return {
    get: opts.getRejects
      ? vi.fn().mockRejectedValue({ status: 404 })
      : vi.fn().mockResolvedValue(viewRows),
    put: vi.fn().mockResolvedValue({}),
  } as unknown as Couchdb;
}

describe("getConflicts", () => {
  it("returns _ids of conflicted documents from view", async () => {
    const couchdb = makeStubCouchdb({
      viewRows: [{ value: "Child:1" }, { value: "Child:2" }],
    });

    const result = await getConflicts(couchdb);

    expect(result).toEqual(["Child:1", "Child:2"]);
  });

  it("upserts design doc when first get fails, then queries view", async () => {
    const couchdb = {
      get: vi
        .fn()
        .mockRejectedValueOnce({ status: 404 })
        .mockResolvedValueOnce([{ value: "Note:5" }]),
      put: vi.fn().mockResolvedValue({}),
    } as unknown as Couchdb;

    const result = await getConflicts(couchdb);

    expect(couchdb.put).toHaveBeenCalledTimes(1);
    expect(couchdb.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual(["Note:5"]);
  });

  it("returns empty array when no conflicts", async () => {
    const couchdb = makeStubCouchdb({ viewRows: [] });
    const result = await getConflicts(couchdb);
    expect(result).toEqual([]);
  });
});
