import type { SystemCredentials } from "../lib/credentials.js";
import { restoreBackup } from "./restore-backup.migration.js";
import { silentLogger } from "./testing/migration-idempotency.harness.js";
import {
  buildRevTrackingCouchdb,
  type RevStore,
} from "./testing/rev-tracking-couchdb.stub.js";
import { TrackedMigrationContext } from "./tracked-migration-context.js";

const org = { name: "test", url: "test.example.com" } as SystemCredentials;
const CONFIG = "app/Config:CONFIG_ENTITY";
const CONFIG_PATH = "/app/Config:CONFIG_ENTITY";

function context(
  store: RevStore,
  migrationId: string,
  runAt: string,
  args: string[] = [],
  confirm: (question: string, id: string) => Promise<boolean> = async () =>
    true,
) {
  return new TrackedMigrationContext(
    buildRevTrackingCouchdb(store),
    org,
    false,
    silentLogger,
    { migrationId, runAt },
    args,
    confirm,
  );
}

/** apply a migration run that sets the config's `data` to the given value */
async function migrateConfig(store: RevStore, runAt: string, data: unknown) {
  const ctx = context(store, "some-migration", runAt);
  await ctx.put(CONFIG_PATH, { ...store[CONFIG], data });
}

function restore(
  store: RevStore,
  args: string[],
  confirm?: (question: string, id: string) => Promise<boolean>,
) {
  const ctx = context(
    store,
    "restore-backup",
    "20261016T000000Z",
    args,
    confirm,
  );
  return restoreBackup.run(ctx);
}

function seed(): RevStore {
  return {
    [CONFIG]: { _id: "Config:CONFIG_ENTITY", _rev: "1-a", data: "original" },
  };
}

describe("restoreBackup migration", () => {
  it("restores a doc to its state before the latest run of the migration", async () => {
    const store = seed();
    await migrateConfig(store, "20261015T090000Z", "first");
    await migrateConfig(store, "20261015T100000Z", "second");

    const result = await restore(store, ["some-migration"]);

    expect(result).toEqual(expect.objectContaining({ changed: true }));
    expect(store[CONFIG].data).toBe("first");
  });

  it("restores the given run", async () => {
    const store = seed();
    await migrateConfig(store, "20261015T090000Z", "first");
    await migrateConfig(store, "20261015T100000Z", "second");

    await restore(store, ["some-migration", "20261015T090000Z"]);

    expect(store[CONFIG].data).toBe("original");
  });

  it("deletes a doc the migration created", async () => {
    const store: RevStore = {};
    const ctx = context(store, "some-migration", "20261015T090000Z");
    await ctx.put("/app/ConfigurableEnum:new", { values: [] });

    await restore(store, ["some-migration"]);

    expect(store["app/ConfigurableEnum:new"]._deleted).toBe(true);
  });

  it("asks before discarding edits made after the migration", async () => {
    const store = seed();
    await migrateConfig(store, "20261015T090000Z", "migrated");
    store[CONFIG] = { ...store[CONFIG], _rev: "3-later", data: "edited" };
    const confirm = vi.fn(async () => false);

    const result = await restore(store, ["some-migration"], confirm);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("edited after the migration"),
      "overwrite-later-edits:Config:CONFIG_ENTITY",
    );
    expect(store[CONFIG].data).toBe("edited");
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(1);
  });

  it("asks before discarding edits if the migration's write was not recorded", async () => {
    const store = seed();
    await migrateConfig(store, "20261015T090000Z", "migrated");
    const backupKey = Object.keys(store).find((k) => k.includes("_local/"))!;
    delete store[backupKey].writtenRev;
    const confirm = vi.fn(async () => false);

    await restore(store, ["some-migration"], confirm);

    expect(confirm).toHaveBeenCalled();
    expect(store[CONFIG].data).toBe("migrated");
  });

  it("can itself be rolled back", async () => {
    const store = seed();
    await migrateConfig(store, "20261015T090000Z", "migrated");
    await restore(store, ["some-migration"]);

    const ctx = context(store, "restore-backup", "20261017T000000Z", [
      "restore-backup",
    ]);
    await restoreBackup.run(ctx);

    expect(store[CONFIG].data).toBe("migrated");
  });

  it("changes nothing if there are no backups", async () => {
    const store = seed();

    const result = await restore(store, ["some-migration"]);

    expect(result.status).toBe("no-change");
    expect(store[CONFIG].data).toBe("original");
  });

  it("fails without a migration id", async () => {
    const result = await restore(seed(), []);

    expect(result.status).toBe("failed");
  });
});
