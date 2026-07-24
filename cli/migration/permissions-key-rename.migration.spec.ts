import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { permissionsKeyRename } from "./permissions-key-rename.migration.js";

function seedLegacyPermissions(): DocStore {
  return {
    "app/Config:Permissions": {
      _id: "Config:Permissions",
      _rev: "1-abc",
      data: {
        public: [{ subject: "Config", action: "read" }],
        default: [{ subject: "SiteSettings", action: "read" }],
        user_app: [{ subject: "all", action: "manage" }],
      },
    },
  };
}

describe("permissionsKeyRename migration", () => {
  it("renames legacy default/public sections to _default/_public and drops the legacy keys", async () => {
    const store = seedLegacyPermissions();
    const ctx = buildTestContext(store, false);

    const result = await permissionsKeyRename.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");
    const data = (store["app/Config:Permissions"] as any).data;
    expect(data._default).toEqual([{ subject: "SiteSettings", action: "read" }]);
    expect(data._public).toEqual([{ subject: "Config", action: "read" }]);
    expect(data.default).toBeUndefined();
    expect(data.public).toBeUndefined();
    // role sections untouched
    expect(data.user_app).toEqual([{ subject: "all", action: "manage" }]);
  });

  it("prefers an existing renamed key and only drops the legacy one", async () => {
    const store: DocStore = {
      "app/Config:Permissions": {
        _id: "Config:Permissions",
        _rev: "1-abc",
        data: {
          _default: [{ subject: "New", action: "read" }],
          default: [{ subject: "Legacy", action: "read" }],
        },
      },
    };
    const ctx = buildTestContext(store, false);

    await permissionsKeyRename.run(ctx);

    const data = (store["app/Config:Permissions"] as any).data;
    expect(data._default).toEqual([{ subject: "New", action: "read" }]);
    expect(data.default).toBeUndefined();
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedLegacyPermissions();
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await permissionsKeyRename.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("is a no-op when there is no permission document", async () => {
    const ctx = buildTestContext({}, false);

    const result = await permissionsKeyRename.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      permissionsKeyRename,
      seedLegacyPermissions(),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
