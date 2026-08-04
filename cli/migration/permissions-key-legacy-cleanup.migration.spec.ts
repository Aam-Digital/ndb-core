import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { permissionsKeyLegacyCleanup } from "./permissions-key-legacy-cleanup.migration.js";

function seedMigratedPermissions(): DocStore {
  return {
    "app/Config:Permissions": {
      _id: "Config:Permissions",
      _rev: "1-abc",
      data: {
        public: [{ subject: "Config", action: "read" }],
        _public: [{ subject: "Config", action: "read" }],
        default: [{ subject: "SiteSettings", action: "read" }],
        _default: [{ subject: "SiteSettings", action: "read" }],
        user_app: [{ subject: "all", action: "manage" }],
      },
    },
  };
}

describe("permissionsKeyLegacyCleanup migration", () => {
  it("removes legacy default/public sections once the underscore-prefixed sections exist", async () => {
    const store = seedMigratedPermissions();
    const ctx = buildTestContext(store, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");
    const data = (store["app/Config:Permissions"] as any).data;
    expect(data.default).toBeUndefined();
    expect(data.public).toBeUndefined();
    expect(data._default).toEqual([
      { subject: "SiteSettings", action: "read" },
    ]);
    expect(data._public).toEqual([{ subject: "Config", action: "read" }]);
    // role sections untouched
    expect(data.user_app).toEqual([{ subject: "all", action: "manage" }]);
  });

  it("leaves a legacy key in place when its underscore-prefixed replacement is missing", async () => {
    const store: DocStore = {
      "app/Config:Permissions": {
        _id: "Config:Permissions",
        _rev: "1-abc",
        data: {
          default: [{ subject: "Legacy", action: "read" }],
          _public: [{ subject: "Config", action: "read" }],
          public: [{ subject: "Config", action: "read" }],
        },
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(true);
    const data = (store["app/Config:Permissions"] as any).data;
    // "default" has no "_default" counterpart yet, so it is kept
    expect(data.default).toEqual([{ subject: "Legacy", action: "read" }]);
    // "public" has a "_public" counterpart, so it is removed
    expect(data.public).toBeUndefined();
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedMigratedPermissions();
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("is a no-op when there is no permission document", async () => {
    const ctx = buildTestContext({}, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it("is a no-op when no legacy keys remain", async () => {
    const store: DocStore = {
      "app/Config:Permissions": {
        _id: "Config:Permissions",
        _rev: "1-abc",
        data: {
          _default: [{ subject: "SiteSettings", action: "read" }],
          _public: [{ subject: "Config", action: "read" }],
        },
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      permissionsKeyLegacyCleanup,
      seedMigratedPermissions(),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
