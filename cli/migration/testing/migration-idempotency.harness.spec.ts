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
  return {};
}

describe("All registered migrations are idempotent", () => {
  test.each(migrations.map((m) => [m.id, m]))(
    'migration "%s" second run reports no-change',
    async (_id, migration) => {
      const seed = seedForMigration(migration.id);
      const result = await runIdempotencyCheck(migration, seed);

      expect(result.secondRunResult.changed).toBe(false);
      expect(
        result.secondRunResult.status === "no-change" ||
          result.secondRunResult.status === "failed",
      ).toBe(true);

      expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
    },
  );
});
