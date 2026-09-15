import { FindableMemoryPouchDatabase } from "./findable-memory-pouch-database";
import { SyncStateSubject } from "../core/session/session-type";

describe("FindableMemoryPouchDatabase", () => {
  let db: FindableMemoryPouchDatabase;

  beforeEach(async () => {
    db = new FindableMemoryPouchDatabase("find-test", new SyncStateSubject());
    db.init("find-test");

    await db.putAll([
      { _id: "TestType:1", timestamp: "2026-01-01T00:00:00.000Z" },
      { _id: "TestType:2", timestamp: "2026-01-02T00:00:00.000Z" },
      { _id: "TestType:3", timestamp: "2026-01-03T00:00:00.000Z" },
      { _id: "OtherType:1", timestamp: "2026-01-04T00:00:00.000Z" },
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
});
