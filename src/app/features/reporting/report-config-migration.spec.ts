import { migrateReportConfig } from "./report-config-migration";

describe("migrateReportConfig", () => {
  it("copies aggregationDefinitions into reportDefinition for reporting/exporting reports and keeps the old field", () => {
    const migrated = migrateReportConfig({
      mode: "reporting",
      aggregationDefinitions: [{ query: "Child:toArray", label: "All" }],
    } as any);

    expect(migrated.reportDefinition).toEqual([
      { query: "Child:toArray", label: "All" },
    ]);
    // non-destructive: the legacy field is retained during the coexistence period
    expect(migrated.aggregationDefinitions).toEqual([
      { query: "Child:toArray", label: "All" },
    ]);
  });

  it("treats an unset mode as reporting and copies aggregationDefinitions", () => {
    const migrated = migrateReportConfig({
      aggregationDefinitions: [{ query: "x" }],
    } as any);

    expect(migrated.reportDefinition).toEqual([{ query: "x" }]);
  });

  it("leaves an SQL report's reportDefinition untouched (and does not remove aggregationDefinitions)", () => {
    const migrated = migrateReportConfig({
      mode: "sql",
      reportDefinition: [{ query: "SELECT 1" }],
      aggregationDefinitions: [{ query: "stale" }],
    } as any);

    expect(migrated.reportDefinition).toEqual([{ query: "SELECT 1" }]);
    expect(migrated.aggregationDefinitions).toEqual([{ query: "stale" }]);
  });

  it("folds a legacy v1 SQL aggregationDefinition into reportDefinition", () => {
    const migrated = migrateReportConfig({
      mode: "sql",
      aggregationDefinition: "SELECT name FROM Child",
    } as any);

    expect(migrated.reportDefinition).toEqual([
      { query: "SELECT name FROM Child" },
    ]);
    // non-destructive: legacy v1 field retained
    expect(migrated.aggregationDefinition).toBe("SELECT name FROM Child");
  });

  it("does not overwrite a v2 SQL reportDefinition with a legacy aggregationDefinition", () => {
    const migrated = migrateReportConfig({
      mode: "sql",
      reportDefinition: [{ query: "SELECT v2" }],
      aggregationDefinition: "SELECT v1",
    } as any);

    expect(migrated.reportDefinition).toEqual([{ query: "SELECT v2" }]);
  });

  it("for a reporting report, overwrites a stale reportDefinition with aggregationDefinitions", () => {
    // e.g. left over after switching mode sql -> reporting in the old two-field form
    const migrated = migrateReportConfig({
      mode: "reporting",
      reportDefinition: [{ query: "SELECT stale" }],
      aggregationDefinitions: [{ query: "Child:toArray", label: "real" }],
    } as any);

    expect(migrated.reportDefinition).toEqual([
      { query: "Child:toArray", label: "real" },
    ]);
  });

  it("does nothing for a non-array (malformed) aggregationDefinitions value", () => {
    const migrated = migrateReportConfig({
      mode: "reporting",
      aggregationDefinitions: { legacy: "object" },
    } as any);

    expect(migrated.reportDefinition).toBeUndefined();
    expect(migrated.aggregationDefinitions).toEqual({
      legacy: "object",
    });
  });

  it("is idempotent (second run makes no further change)", () => {
    const once = migrateReportConfig({
      mode: "reporting",
      aggregationDefinitions: [{ query: "x" }],
    } as any);
    const twice = migrateReportConfig(JSON.parse(JSON.stringify(once)));

    expect(twice).toEqual(once);
  });

  it("returns nullish input unchanged", () => {
    expect(migrateReportConfig(undefined as any)).toBeUndefined();
  });
});
