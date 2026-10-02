import { MemoryPouchDatabase } from "./memory-pouch-database";
import { SyncStateSubject } from "../../session/session-type";

describe("MemoryPouchDatabase.find", () => {
  let db: MemoryPouchDatabase;

  beforeEach(async () => {
    db = new MemoryPouchDatabase("find-test", new SyncStateSubject());
    db.init("find-test");

    await db.putAll([
      { _id: "TestType:1", timestamp: "2026-01-01T00:00:00.000Z", kind: "a" },
      { _id: "TestType:2", timestamp: "2026-01-02T00:00:00.000Z", kind: "b" },
      { _id: "TestType:3", timestamp: "2026-01-03T00:00:00.000Z", kind: "b" },
      { _id: "OtherType:1", timestamp: "2026-01-04T00:00:00.000Z", kind: "a" },
    ]);
  });

  afterEach(() => db.destroy());

  it("should return only documents of the requested type", async () => {
    const res = await db.find("TestType");

    expect(res.docs.map((d) => d._id)).toEqual([
      "TestType:1",
      "TestType:2",
      "TestType:3",
    ]);
  });

  it("should apply the given selector", async () => {
    const res = await db.find("TestType", {
      timestamp: { $gte: "2026-01-02T00:00:00.000Z" },
    });

    expect(res.docs.map((d) => d._id)).toEqual(["TestType:2", "TestType:3"]);
  });

  it("should page through results with the returned bookmark", async () => {
    const first = await db.find("TestType", {}, { limit: 2 });
    const second = await db.find(
      "TestType",
      {},
      { limit: 2, bookmark: first.bookmark },
    );

    expect(first.docs.map((d) => d._id)).toEqual(["TestType:1", "TestType:2"]);
    expect(second.docs.map((d) => d._id)).toEqual(["TestType:3"]);
  });

  it("should sort on one field while filtering on another", async () => {
    const res = await db.find("TestType", { kind: "b" }, undefined, {
      prop: "timestamp",
      dir: "desc",
    });

    expect(res.docs.map((d) => d._id)).toEqual(["TestType:3", "TestType:2"]);
  });

  it("should sort on an indexed field", async () => {
    const res = await db.find("TestType", {}, undefined, {
      prop: "timestamp",
      dir: "desc",
    });

    expect(res.docs.map((d) => d._id)).toEqual([
      "TestType:3",
      "TestType:2",
      "TestType:1",
    ]);
  });

  describe("documents without a value for the sort field", () => {
    beforeEach(async () => {
      // CouchDB's index only contains docs that have the indexed field, so
      // these are what a sorted query through the index would skip
      await db.putAll([
        { _id: "TestType:4", kind: "a" },
        { _id: "TestType:5", kind: "b" },
      ]);
    });

    it("should include them last when sorting ascending", async () => {
      const res = await db.find("TestType", {}, undefined, {
        prop: "timestamp",
        dir: "asc",
      });

      expect(res.docs.map((d) => d._id)).toEqual([
        "TestType:1",
        "TestType:2",
        "TestType:3",
        "TestType:4",
        "TestType:5",
      ]);
    });

    it("should include them first when sorting descending", async () => {
      const res = await db.find("TestType", {}, undefined, {
        prop: "timestamp",
        dir: "desc",
      });

      expect(res.docs.map((d) => d._id)).toEqual([
        "TestType:4",
        "TestType:5",
        "TestType:3",
        "TestType:2",
        "TestType:1",
      ]);
    });

    it("should page across sorted and missing values without gaps or duplicates", async () => {
      const sort = { prop: "timestamp", dir: "asc" as const };
      const first = await db.find("TestType", {}, { limit: 2 }, sort);
      const second = await db.find(
        "TestType",
        {},
        { limit: 2, bookmark: first.bookmark },
        sort,
      );
      const third = await db.find(
        "TestType",
        {},
        { limit: 2, bookmark: second.bookmark },
        sort,
      );

      expect(first.docs.map((d) => d._id)).toEqual([
        "TestType:1",
        "TestType:2",
      ]);
      expect(second.docs.map((d) => d._id)).toEqual([
        "TestType:3",
        "TestType:4",
      ]);
      expect(third.docs.map((d) => d._id)).toEqual(["TestType:5"]);
    });

    it("should apply the filter to them as well", async () => {
      const res = await db.find("TestType", { kind: "b" }, undefined, {
        prop: "timestamp",
        dir: "asc",
      });

      expect(res.docs.map((d) => d._id)).toEqual([
        "TestType:2",
        "TestType:3",
        "TestType:5",
      ]);
    });

    it("should apply a filter on the id to them as well", async () => {
      const res = await db.find(
        "TestType",
        { _id: { $in: ["TestType:2", "TestType:4"] } },
        undefined,
        { prop: "timestamp", dir: "asc" },
      );

      expect(res.docs.map((d) => d._id)).toEqual(["TestType:2", "TestType:4"]);
    });

    it("should not include them when the filter requires a value for the sort field", async () => {
      const res = await db.find(
        "TestType",
        { timestamp: { $gte: "2026-01-02T00:00:00.000Z" } },
        undefined,
        { prop: "timestamp", dir: "asc" },
      );

      expect(res.docs.map((d) => d._id)).toEqual(["TestType:2", "TestType:3"]);
    });

    it("should not include docs of other types without the sort field", async () => {
      await db.put({ _id: "OtherType:2", kind: "a" });

      const res = await db.find("TestType", {}, undefined, {
        prop: "timestamp",
        dir: "asc",
      });

      expect(res.docs.map((d) => d._id)).not.toContain("OtherType:2");
    });
  });
});
