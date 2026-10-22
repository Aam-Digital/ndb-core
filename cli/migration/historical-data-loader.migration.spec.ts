import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import {
  historicalDataLoader,
  migrateHistoricalDataLoader,
} from "./historical-data-loader.migration.js";

function seedConfig(panelComponent: unknown): DocStore {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "1-abc",
      data: {
        "view:child/:id": {
          component: "EntityDetails",
          config: {
            entityType: "Child",
            panels: [{ title: "Observations", components: [panelComponent] }],
          },
        },
      },
    },
  };
}

function panelComponentOf(store: DocStore): unknown {
  return (store["app/Config:CONFIG_ENTITY"] as any).data["view:child/:id"]
    .config.panels[0].components[0];
}

describe("historicalDataLoader migration", () => {
  it.each([
    [
      "the HistoricalDataService loaderMethod",
      {
        component: "RelatedEntities",
        config: {
          entityType: "HistoricalEntityData",
          loaderMethod: "HistoricalDataService",
          columns: ["date"],
        },
      },
      {
        component: "RelatedEntities",
        config: {
          entityType: "HistoricalEntityData",
          columns: ["date"],
          property: "relatedEntity",
        },
      },
    ],
    [
      "the legacy HistoricalDataComponent with a columns array",
      { component: "HistoricalDataComponent", config: ["date"] },
      {
        component: "RelatedEntities",
        config: {
          columns: ["date"],
          entityType: "HistoricalEntityData",
          property: "relatedEntity",
        },
      },
    ],
    [
      "the legacy HistoricalDataComponent without config",
      { component: "HistoricalDataComponent" },
      {
        component: "RelatedEntities",
        config: {
          entityType: "HistoricalEntityData",
          property: "relatedEntity",
        },
      },
    ],
    [
      "the loaderMethod but keeps an explicitly configured property",
      {
        component: "RelatedEntities",
        config: {
          entityType: "HistoricalEntityData",
          loaderMethod: "HistoricalDataService",
          property: "otherRef",
        },
      },
      {
        component: "RelatedEntities",
        config: { entityType: "HistoricalEntityData", property: "otherRef" },
      },
    ],
  ])("replaces %s with a filter on the relation field", (_, before, after) => {
    expect(migrateHistoricalDataLoader(before)).toEqual(after);
  });

  it("leaves other loaderMethods unchanged", () => {
    const other = {
      component: "RelatedEntities",
      config: { entityType: "Note", loaderMethod: "NotesRelatedToEntity" },
    };

    expect(migrateHistoricalDataLoader(structuredClone(other))).toEqual(other);
  });

  it("writes the migrated config document", async () => {
    const store = seedConfig({
      component: "RelatedEntities",
      config: {
        entityType: "HistoricalEntityData",
        loaderMethod: "HistoricalDataService",
      },
    });
    const ctx = buildTestContext(store, false);

    const result = await historicalDataLoader.run(ctx);

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(panelComponentOf(store)).toEqual({
      component: "RelatedEntities",
      config: { entityType: "HistoricalEntityData", property: "relatedEntity" },
    });
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedConfig({ component: "HistoricalDataComponent" });
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await historicalDataLoader.run(ctx);

    expect(result).toEqual({ changed: true, status: "dry-run" });
    expect(JSON.stringify(store)).toBe(before);
  });

  it("fails when there is no config document", async () => {
    const ctx = buildTestContext({}, false);

    const result = await historicalDataLoader.run(ctx);

    expect(result.status).toBe("failed");
    expect(result.warnings).toEqual(["Config document not found"]);
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      historicalDataLoader,
      seedConfig({ component: "HistoricalDataComponent", config: ["date"] }),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
