import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { reportQueryIsActive } from "./report-query-isactive.migration.js";

function seedReport(
  reportDefinition: unknown[],
  mode?: string,
  id = "ReportConfig:basic",
): DocStore {
  return {
    [`app/${id}`]: {
      _id: id,
      _rev: "1-abc",
      title: "Basic Report",
      ...(mode ? { mode } : {}),
      reportDefinition,
    },
  };
}

describe("reportQueryIsActive migration", () => {
  it("rewrites isActive selections including nested ones", async () => {
    const store = seedReport([
      { query: "Child:toArray[*isActive=true]", label: "All children" },
      {
        query: "School:toArray",
        aggregations: [
          {
            query:
              ":getRelated(ChildSchoolRelation, schoolId)[*isActive = true].childId:unique",
          },
        ],
        subQueries: [{ query: "Child:toArray[*isActive=false]" }],
      },
    ]);
    const ctx = buildTestContext(store, false);

    const result = await reportQueryIsActive.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");
    const def = (store["app/ReportConfig:basic"] as any).reportDefinition;
    expect(def[0].query).toBe("Child:toArray:filterActive");
    expect(def[1].aggregations[0].query).toBe(
      ":getRelated(ChildSchoolRelation, schoolId):filterActive.childId:unique",
    );
    expect(def[1].subQueries[0].query).toBe("Child:toArray:filterInactive");
  });

  it("leaves SQL reports and unrelated queries untouched", async () => {
    const store = {
      ...seedReport(
        [{ query: "SELECT * FROM children WHERE isActive=true" }],
        "sql",
        "ReportConfig:sql",
      ),
      ...seedReport([{ query: "Child:toArray[*privateSchool=true]" }]),
    };
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, false);

    const result = await reportQueryIsActive.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
    expect(JSON.stringify(store)).toBe(before);
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedReport([{ query: "Child:toArray[*isActive=true]" }]);
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await reportQueryIsActive.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      reportQueryIsActive,
      seedReport([{ query: "Child:toArray[*isActive=true]" }]),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
