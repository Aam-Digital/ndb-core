import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { latestConfigFormats } from "./latest-config-formats.migration.js";

const CONFIG_PATH = "app/Config:CONFIG_ENTITY";

describe("latestConfigFormats migration", () => {
  it("handles missing Config document without throwing", async () => {
    const ctx = buildTestContext({});
    const result = await latestConfigFormats.run(ctx);

    expect(result.status).toBe("failed");
    expect(result.changed).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("not found")]),
    );
  });

  it("applies migrations and marks changed: true when config is in old format", async () => {
    const seed: DocStore = {
      [CONFIG_PATH]: {
        _id: "Config:CONFIG_ENTITY",
        data: {
          "view:Dashboard": {
            component: "Dashboard",
            config: {
              widgets: [
                {
                  component: "ShortcutDashboard",
                  config: { shortcuts: [{ label: "Go", link: "child/123" }] },
                },
              ],
            },
          },
        },
      },
    };
    const result = await runIdempotencyCheck(latestConfigFormats, seed);

    // Second run must report no-change
    expect(result.secondRunResult.changed).toBe(false);
    expect(result.secondRunResult.status).toBe("no-change");
    expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
  });

  it("reports no-change when config is already in latest format", async () => {
    const seed: DocStore = {
      [CONFIG_PATH]: {
        _id: "Config:CONFIG_ENTITY",
        data: {
          "entity:Child": {
            attributes: {
              name: { dataType: "string" },
            },
          },
        },
      },
    };
    const ctx = buildTestContext(seed);
    const result = await latestConfigFormats.run(ctx);

    expect(result.status).toBe("no-change");
    expect(result.changed).toBe(false);
  });

  it("is idempotent on a minimal config doc", async () => {
    const seed: DocStore = {
      [CONFIG_PATH]: {
        _id: "Config:CONFIG_ENTITY",
        data: {
          "entity:Child": {
            attributes: {
              name: { dataType: "string", label: "Name" },
            },
          },
        },
      },
    };
    const result = await runIdempotencyCheck(latestConfigFormats, seed);

    expect(result.secondRunResult.changed).toBe(false);
    expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
  });
});
