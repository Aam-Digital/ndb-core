import { isHierarchicalReport, ReportEntity, SqlReport } from "./report-config";

describe("isHierarchicalReport", () => {
  it("returns false when the report is undefined", () => {
    expect(isHierarchicalReport(undefined)).toBe(false);
  });

  it("returns false when the report has no reportDefinition (legacy v1)", () => {
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    expect(isHierarchicalReport(report)).toBe(false);
  });

  it("returns false for a single ungrouped query (tabular)", () => {
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";
    report.reportDefinition = [{ query: "SELECT a, b FROM foo" }];

    expect(isHierarchicalReport(report)).toBe(false);
  });

  it("returns true when any item has a groupTitle", () => {
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";
    report.reportDefinition = [
      { groupTitle: "Group A", items: [{ query: "SELECT count(*) FROM foo" }] },
    ];

    expect(isHierarchicalReport(report)).toBe(true);
  });

  it("returns true when there is more than one top-level item", () => {
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";
    report.reportDefinition = [
      { query: "SELECT count(*) FROM foo" },
      { query: "SELECT count(*) FROM bar" },
    ];

    expect(isHierarchicalReport(report)).toBe(true);
  });
});
