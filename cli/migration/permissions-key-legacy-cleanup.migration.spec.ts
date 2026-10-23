import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { permissionsKeyLegacyCleanup } from "./permissions-key-legacy-cleanup.migration.js";

const DOC_KEY = "app/Config:Permissions";

const publicRules = [{ subject: "Config", action: "read" }];
const defaultRules = [{ subject: "SiteSettings", action: "read" }];
const staleRules = [{ subject: "Stale", action: "read" }];
const roleRules = [{ subject: "all", action: "manage" }];

function seed(data: Record<string, unknown>): DocStore {
  return {
    [DOC_KEY]: { _id: "Config:Permissions", _rev: "1-abc", data },
  };
}

describe("permissionsKeyLegacyCleanup migration", () => {
  it.each([
    {
      name: "only legacy keys: moved to the underscore keys",
      data: { default: defaultRules, public: publicRules, user_app: roleRules },
      expected: {
        _default: defaultRules,
        _public: publicRules,
        user_app: roleRules,
      },
      changed: true,
    },
    {
      name: "both keys: legacy removed, underscore key wins",
      data: {
        default: staleRules,
        _default: defaultRules,
        public: staleRules,
        _public: publicRules,
        user_app: roleRules,
      },
      expected: {
        _default: defaultRules,
        _public: publicRules,
        user_app: roleRules,
      },
      changed: true,
    },
    {
      name: "only underscore keys: unchanged",
      data: { _default: defaultRules, _public: publicRules },
      expected: { _default: defaultRules, _public: publicRules },
      changed: false,
    },
  ])("$name", async ({ data, expected, changed }) => {
    const store = seed(data);
    const ctx = buildTestContext(store, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(changed);
    expect(result.status).toBe(changed ? "ok" : "no-change");
    expect((store[DOC_KEY] as any).data).toEqual(expected);
  });

  it("is a no-op when there is no permission document", async () => {
    const ctx = buildTestContext({}, false);

    const result = await permissionsKeyLegacyCleanup.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      permissionsKeyLegacyCleanup,
      seed({ default: defaultRules, public: staleRules, _public: publicRules }),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
