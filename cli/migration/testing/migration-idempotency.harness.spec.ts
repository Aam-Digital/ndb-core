import { migrations } from "../migrations.js";
import { runIdempotencyCheck } from "./migration-idempotency.harness.js";

function seedForMigration(id: string): Record<string, unknown> {
  if (id === "latest-config-formats") {
    return {
      "app/Config:CONFIG_ENTITY": {
        _id: "Config:CONFIG_ENTITY",
        data: {
          "entity:Child": {
            attributes: [{ name: "name", schema: { dataType: "string" } }],
          },
          views: [],
        },
      },
    };
  }
  if (id === "set-map-countrycodes") {
    return {
      "app/Config:CONFIG_ENTITY": {
        _id: "Config:CONFIG_ENTITY",
        data: {},
      },
    };
  }
  return {};
}

/** Arguments for the migrations that take a value, so they do real work here. */
function argsForMigration(id: string): string[] {
  return id === "set-map-countrycodes" ? ["de"] : [];
}

describe("All registered migrations are idempotent", () => {
  test.each(migrations.map((m) => [m.id, m]))(
    'migration "%s" second run makes no state change',
    async (_id, migration) => {
      const seed = seedForMigration(migration.id);
      const result = await runIdempotencyCheck(
        migration,
        seed,
        argsForMigration(migration.id),
      );

      expect(result.secondRunResult.changed).toBe(false);
      expect(
        result.secondRunResult.status === "no-change" ||
          result.secondRunResult.status === "failed",
      ).toBe(true);

      expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
    },
  );
});
