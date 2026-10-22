import {
  buildTestContext,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { historicalDataLoader } from "./historical-data-loader.migration.js";

function seedConfig(loaderMethod: string) {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "1-abc",
      data: {
        "view:child/:id": {
          component: "EntityDetails",
          config: {
            panels: [
              {
                components: [
                  {
                    component: "RelatedEntities",
                    config: {
                      entityType: "HistoricalEntityData",
                      loaderMethod,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
  };
}

describe("historicalDataLoader migration", () => {
  it("removes the HistoricalDataService loaderMethod", async () => {
    const store = seedConfig("HistoricalDataService");

    const result = await historicalDataLoader.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(
      (store["app/Config:CONFIG_ENTITY"] as any).data["view:child/:id"].config
        .panels[0].components[0].config,
    ).toEqual({ entityType: "HistoricalEntityData" });
  });

  it("leaves other loaderMethods unchanged", async () => {
    const result = await historicalDataLoader.run(
      buildTestContext(seedConfig("NotesRelatedToEntity"), false),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      historicalDataLoader,
      seedConfig("HistoricalDataService"),
    );

    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
