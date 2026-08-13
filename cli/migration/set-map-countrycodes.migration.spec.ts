import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { setMapCountrycodes } from "./set-map-countrycodes.migration.js";

function seedConfig(mapConfig?: Record<string, unknown>): DocStore {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "1-abc",
      data: {
        "appConfig:usage-analytics": { url: "https://example.com" },
        ...(mapConfig ? { "appConfig:map": mapConfig } : {}),
      },
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getMapConfig(store: DocStore): any {
  return (store["app/Config:CONFIG_ENTITY"] as any).data["appConfig:map"];
}

describe("setMapCountrycodes migration", () => {
  it("adds the given country filter when the map config does not exist yet", async () => {
    const store = seedConfig();
    const ctx = buildTestContext(store, false, ["de"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");
    expect(getMapConfig(store)).toEqual({ countrycodes: "de" });
    // unrelated config keys stay untouched
    expect(
      (store["app/Config:CONFIG_ENTITY"] as any).data[
        "appConfig:usage-analytics"
      ],
    ).toEqual({ url: "https://example.com" });
  });

  it("keeps other map settings when setting the country filter", async () => {
    const store = seedConfig({ start: [53.55, 9.99] });
    const ctx = buildTestContext(store, false, ["de,at"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(true);
    expect(getMapConfig(store)).toEqual({
      start: [53.55, 9.99],
      countrycodes: "de,at",
    });
  });

  it("replaces a different country filter", async () => {
    const store = seedConfig({ countrycodes: "in" });
    const ctx = buildTestContext(store, false, ["de"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(true);
    expect(getMapConfig(store)).toEqual({ countrycodes: "de" });
  });

  it("changes nothing when the country filter already has the given value", async () => {
    const store = seedConfig({ countrycodes: "de" });
    const ctx = buildTestContext(store, false, ["de"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it.each([
    ["no country code", []],
    ["several arguments instead of one list", ["de", "at"]],
    ["an empty entry in the list", ["de,,at"]],
    ["something that is not a country code", ["deu"]],
  ])("fails without touching anything given %s", async (_case, args) => {
    const store = seedConfig();
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, false, args);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("failed");
    expect(JSON.stringify(store)).toBe(before);
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedConfig();
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true, ["de"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("fails when there is no config document", async () => {
    const ctx = buildTestContext({}, false, ["de"]);

    const result = await setMapCountrycodes.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("failed");
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(setMapCountrycodes, seedConfig(), [
      "de",
    ]);

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
