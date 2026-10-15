import type { SystemCredentials } from "../lib/credentials.js";
import { silentLogger } from "./testing/migration-idempotency.harness.js";
import {
  buildRevTrackingCouchdb,
  type RevStore,
} from "./testing/rev-tracking-couchdb.stub.js";
import { TrackedMigrationContext } from "./tracked-migration-context.js";

const org = { name: "test", url: "test.example.com" } as SystemCredentials;
const backupRun = { migrationId: "some-migration", runAt: "20261015T090000Z" };
const BACKUP_KEY =
  "app/_local/migration-backup:some-migration:20261015T090000Z:Config:CONFIG_ENTITY";

function setup(store: RevStore, dryRun = false) {
  const couchdb = buildRevTrackingCouchdb(store);
  const ctx = new TrackedMigrationContext(
    couchdb,
    org,
    dryRun,
    silentLogger,
    backupRun,
  );
  return { couchdb, ctx };
}

function seed(): RevStore {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "3-abc",
      data: { old: true },
    },
  };
}

describe("TrackedMigrationContext backups", () => {
  it("backs up the previous version of a doc before overwriting it", async () => {
    const store = seed();
    const { ctx } = setup(store);

    await ctx.put("/app/Config:CONFIG_ENTITY", {
      _id: "Config:CONFIG_ENTITY",
      _rev: "3-abc",
      data: { new: true },
    });

    expect(store["app/Config:CONFIG_ENTITY"].data).toEqual({ new: true });
    expect(store[BACKUP_KEY]).toEqual(
      expect.objectContaining({
        migrationId: "some-migration",
        runAt: "20261015T090000Z",
        db: "app",
        docId: "Config:CONFIG_ENTITY",
        doc: {
          _id: "Config:CONFIG_ENTITY",
          _rev: "3-abc",
          data: { old: true },
        },
        writtenRev: "4-stub",
      }),
    );
    expect(ctx.getWriteStats()).toEqual({
      intended: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it("keeps the version from before the run if a doc is written twice", async () => {
    const store = seed();
    const { ctx } = setup(store);

    await ctx.put("/app/Config:CONFIG_ENTITY", { _rev: "3-abc", data: 1 });
    await ctx.put("/app/Config:CONFIG_ENTITY", { _rev: "4-stub", data: 2 });

    expect(store[BACKUP_KEY].doc).toEqual(
      expect.objectContaining({ data: { old: true } }),
    );
    expect(store[BACKUP_KEY].writtenRev).toBe("5-stub");
  });

  it("records a doc the migration creates as not existing before", async () => {
    const store: RevStore = {};
    const { ctx } = setup(store);

    await ctx.put("/app/Config:CONFIG_ENTITY", { data: { new: true } });

    expect(store[BACKUP_KEY].doc).toBeNull();
  });

  it("writes no backup in a dry run", async () => {
    const store = seed();
    const before = structuredClone(store);
    const { ctx } = setup(store, true);

    await ctx.put("/app/Config:CONFIG_ENTITY", { _rev: "3-abc", data: 1 });

    expect(store).toEqual(before);
  });

  it("does not write the doc if its backup fails", async () => {
    const store = seed();
    const { couchdb, ctx } = setup(store);
    const put = couchdb.put as ReturnType<typeof vi.fn>;
    const realPut = put.getMockImplementation()!;
    put.mockImplementation(async (path: string, ...rest: unknown[]) => {
      if (path.includes("/_local/")) throw new Error("HTTP 500");
      return realPut(path, ...rest);
    });

    await expect(
      ctx.put("/app/Config:CONFIG_ENTITY", { _rev: "3-abc", data: 1 }),
    ).rejects.toThrow("HTTP 500");

    expect(store["app/Config:CONFIG_ENTITY"].data).toEqual({ old: true });
    expect(ctx.getWriteStats()).toEqual({
      intended: 1,
      succeeded: 0,
      failed: 1,
    });
  });
});
