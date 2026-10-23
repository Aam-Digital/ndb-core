import {
  buildTestContext,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { publicFormLegacyFormats } from "./public-form-legacy-formats.migration.js";

function seedForm(fields: unknown[]) {
  return {
    "app/PublicFormConfig:test": {
      _id: "PublicFormConfig:test",
      _rev: "1-abc",
      route: "test",
      entity: "Child",
      columns: [{ fields: ["name", ...fields] }],
    },
  };
}

describe("publicFormLegacyFormats migration", () => {
  it.each([
    [
      { id: "status", defaultValue: "new" },
      {
        id: "status",
        defaultValue: { mode: "static", config: { value: "new" } },
      },
    ],
    [
      { id: "date", defaultValue: "$now" },
      {
        id: "date",
        defaultValue: { mode: "dynamic", config: { value: "$now" } },
      },
    ],
    [
      { id: "gender", defaultValue: { mode: "static", value: "F" } },
      {
        id: "gender",
        defaultValue: { mode: "static", config: { value: "F" } },
      },
    ],
    [
      {
        id: "school",
        defaultValue: {
          mode: "inherited",
          localAttribute: "child",
          field: "school",
        },
      },
      {
        id: "school",
        defaultValue: {
          mode: "inherited-field",
          config: { sourceReferenceField: "child", sourceValueField: "school" },
        },
      },
    ],
    [
      { id: "children", dataType: "entity-array", additional: "Child" },
      {
        id: "children",
        dataType: "entity",
        isArray: true,
        additional: "Child",
      },
    ],
    [
      {
        id: "progress",
        dataType: "number",
        viewComponent: "DisplayPercentage",
      },
      { id: "progress", dataType: "percentage" },
    ],
  ])("converts the legacy field %j", async (field, expected) => {
    const store = seedForm([field]);

    const result = await publicFormLegacyFormats.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(
      (store["app/PublicFormConfig:test"] as any).columns[0].fields,
    ).toEqual(["name", expected]);
  });

  it("leaves forms in the latest format unchanged", async () => {
    const result = await publicFormLegacyFormats.run(
      buildTestContext(
        seedForm([
          {
            id: "status",
            defaultValue: { mode: "static", config: { value: "new" } },
          },
        ]),
        false,
      ),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      publicFormLegacyFormats,
      seedForm([
        {
          id: "status",
          defaultValue: { mode: "inherited", localAttribute: "a", field: "b" },
        },
      ]),
    );

    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
