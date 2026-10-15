import { listBackups } from "./migration-backup.js";
import {
  buildRevTrackingCouchdb,
  type RevStore,
} from "./testing/rev-tracking-couchdb.stub.js";

describe("listBackups", () => {
  const store: RevStore = {
    "app/_local/migration-backup:m:20261015T100000Z:Doc:1": {
      migrationId: "m",
      runAt: "20261015T100000Z",
      db: "app",
      docId: "Doc:1",
      doc: null,
    },
    "app/_local/migration-backup:m:20261015T090000Z:Doc:1": {
      migrationId: "m",
      runAt: "20261015T090000Z",
      db: "app",
      docId: "Doc:1",
      doc: null,
    },
    "app/_local/migration-backup:m-other:20261015T090000Z:Doc:1": {
      migrationId: "m-other",
      runAt: "20261015T090000Z",
      db: "app",
      docId: "Doc:1",
      doc: null,
    },
  };

  it("lists the backups of a migration, oldest run first", async () => {
    const backups = await listBackups(
      buildRevTrackingCouchdb(store),
      "app",
      "m",
    );

    expect(backups.map((b) => [b.migrationId, b.runAt])).toEqual([
      ["m", "20261015T090000Z"],
      ["m", "20261015T100000Z"],
    ]);
  });

  it("loads the docs separately if _local_docs does not include them", async () => {
    const couchdb = buildRevTrackingCouchdb(store);
    const get = vi.mocked(couchdb.get);
    const realGet = get.getMockImplementation()!;
    get.mockImplementation(async (path, db) => {
      const result = await realGet(path, db);
      return path.includes("_local_docs")
        ? (result as { id: string }[]).map(({ id }) => ({ id }))
        : result;
    });

    const backups = await listBackups(couchdb, "app", "m", "20261015T090000Z");

    expect(backups).toEqual([
      expect.objectContaining({ migrationId: "m", runAt: "20261015T090000Z" }),
    ]);
  });
});
