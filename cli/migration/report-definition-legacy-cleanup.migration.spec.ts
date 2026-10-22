import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { reportDefinitionLegacyCleanup } from "./report-definition-legacy-cleanup.migration.js";

const ID = "ReportConfig:r";

function seed(...reports: Record<string, unknown>[]): DocStore {
  return Object.fromEntries(
    reports.map((report, i) => {
      const id = reports.length === 1 ? ID : `${ID}${i}`;
      return [`app/${id}`, { _id: id, _rev: "1-abc", ...report }];
    }),
  );
}

const PERIOD = { startDate: ["SQL_FROM_DATE"], endDate: ["SQL_TO_DATE"] };

describe("reportDefinitionLegacyCleanup migration", () => {
  it.each([
    [
      "drops aggregationDefinitions already consolidated into reportDefinition",
      {
        mode: "reporting",
        aggregationDefinitions: [{ query: "Child:toArray" }],
        reportDefinition: [{ query: "Child:toArray" }],
        neededArgs: [],
      },
      { mode: "reporting", reportDefinition: [{ query: "Child:toArray" }] },
    ],
    [
      "consolidates aggregationDefinitions of a never migrated report first",
      { aggregationDefinitions: [{ label: "x", query: "Child:toArray" }] },
      { reportDefinition: [{ label: "x", query: "Child:toArray" }] },
    ],
    [
      "keeps an edited reportDefinition over stale aggregationDefinitions",
      {
        mode: "exporting",
        aggregationDefinitions: [{ query: "old" }],
        reportDefinition: [{ query: "edited" }],
      },
      { mode: "exporting", reportDefinition: [{ query: "edited" }] },
    ],
    [
      "folds a v1 SQL query without args into reportDefinition",
      {
        mode: "sql",
        version: 1,
        aggregationDefinition: "SELECT name FROM Child",
        neededArgs: [],
      },
      { mode: "sql", reportDefinition: [{ query: "SELECT name FROM Child" }] },
    ],
    [
      "drops v1 fields next to a v2 SQL reportDefinition",
      {
        mode: "sql",
        version: 2,
        aggregationDefinition: "SELECT v1",
        neededArgs: ["from", "to"],
        transformations: PERIOD,
        reportDefinition: [{ query: "SELECT v2 WHERE d > $startDate" }],
      },
      {
        mode: "sql",
        transformations: PERIOD,
        reportDefinition: [{ query: "SELECT v2 WHERE d > $startDate" }],
      },
    ],
    [
      "converts positional v1 SQL args to named date placeholders",
      {
        mode: "sql",
        aggregationDefinition:
          "SELECT '?' AS q FROM Note WHERE date BETWEEN ? AND ? -- what?",
        neededArgs: ["from", "to"],
      },
      {
        mode: "sql",
        transformations: PERIOD,
        reportDefinition: [
          {
            query:
              "SELECT '?' AS q FROM Note WHERE date BETWEEN $startDate AND $endDate -- what?",
          },
        ],
      },
    ],
    [
      "converts a v1 query consolidated earlier (reportDefinition with ? placeholders)",
      {
        mode: "sql",
        aggregationDefinition: "SELECT * FROM Note WHERE date >= ?",
        reportDefinition: [{ query: "SELECT * FROM Note WHERE date >= ?" }],
        neededArgs: ["startDate"],
      },
      {
        mode: "sql",
        transformations: PERIOD,
        reportDefinition: [
          { query: "SELECT * FROM Note WHERE date >= $startDate" },
        ],
      },
    ],
  ])("%s", async (_name, legacy, expected) => {
    const store = seed(legacy);

    const result = await reportDefinitionLegacyCleanup.run(
      buildTestContext(store, false),
    );

    expect(result.changed).toBe(true);
    expect(store[`app/${ID}`]).toEqual({ _id: ID, _rev: "1-abc", ...expected });
  });

  it("warns when removing aggregationDefinitions that differed from reportDefinition", async () => {
    const store = seed({
      aggregationDefinitions: [{ query: "old" }],
      reportDefinition: [{ query: "edited" }],
    });

    const result = await reportDefinitionLegacyCleanup.run(
      buildTestContext(store, false),
    );

    expect(result.status).toBe("ok");
    expect(result.warnings).toEqual([
      expect.stringContaining("differed from reportDefinition"),
    ]);
  });

  it.each([
    [
      "args other than the report period",
      { aggregationDefinition: "SELECT * WHERE x = ?", neededArgs: ["school"] },
    ],
    [
      "more placeholders than args",
      { aggregationDefinition: "SELECT ? , ?", neededArgs: ["from"] },
    ],
    [
      "an aggregationDefinition that is not a query string",
      { aggregationDefinition: { query: "SELECT 1" } },
    ],
  ])(
    "leaves an SQL report untouched and reports it for %s",
    async (_name, legacy) => {
      const store = seed({ mode: "sql", ...legacy }, { neededArgs: [] });
      const before = structuredClone(store[`app/${ID}0`]);

      const result = await reportDefinitionLegacyCleanup.run(
        buildTestContext(store, false),
      );

      expect(store[`app/${ID}0`]).toEqual(before);
      expect(store[`app/${ID}1`]).toEqual({ _id: `${ID}1`, _rev: "1-abc" });
      expect(result.changed).toBe(true);
      expect(result.status).toBe("partial");
      expect(result.warnings).toEqual([
        expect.stringContaining(`${ID}0 left unchanged`),
      ]);
    },
  );

  it("leaves a report with malformed aggregationDefinitions and no reportDefinition untouched", async () => {
    const store = seed({ aggregationDefinitions: { legacy: "object" } });

    const result = await reportDefinitionLegacyCleanup.run(
      buildTestContext(store, false),
    );

    expect(result.status).toBe("partial");
    expect(result.changed).toBe(false);
    expect(store[`app/${ID}`]).toEqual({
      _id: ID,
      _rev: "1-abc",
      aggregationDefinitions: { legacy: "object" },
    });
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seed({ aggregationDefinitions: [{ query: "x" }] });
    const before = JSON.stringify(store);

    const result = await reportDefinitionLegacyCleanup.run(
      buildTestContext(store, true),
    );

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      reportDefinitionLegacyCleanup,
      seed(
        { mode: "sql", aggregationDefinition: "SELECT ?", neededArgs: ["to"] },
        { aggregationDefinitions: [{ query: "x" }], neededArgs: [] },
        { mode: "sql", reportDefinition: [{ query: "SELECT 1" }] },
      ),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
