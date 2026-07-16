import {
  isHierarchicalReport,
  reportUsesDateRange,
  ReportEntity,
  SqlReport,
} from "./report-config";

describe("ReportConfig entity", () => {
  it("is an admin-managed entity with a route, labels and a title toString", () => {
    // Entity.route getter normalizes to a leading slash
    expect(ReportEntity.route).toBe("/admin/report-config");
    expect(ReportEntity.isInternalEntity).toBe(true);
    expect(ReportEntity.label).toBeTruthy();
    expect(ReportEntity.labelPlural).toBeTruthy();
    expect(ReportEntity.toStringAttributes).toContain("title");
  });

  it("has a description field in its schema", () => {
    expect(ReportEntity.schema.has("description")).toBe(true);
  });
});

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

describe("reportUsesDateRange", () => {
  it("returns false when the report is undefined", () => {
    expect(reportUsesDateRange(undefined)).toBe(false);
  });

  it("detects the $startDate/$endDate placeholders in sql queries, incl. nested groups", () => {
    expect(
      reportUsesDateRange({
        mode: "sql",
        reportDefinition: [{ query: "SELECT * FROM c" }],
      }),
    ).toBe(false);

    expect(
      reportUsesDateRange({
        mode: "sql",
        reportDefinition: [
          {
            groupTitle: "G",
            items: [
              {
                query:
                  "SELECT * FROM c WHERE d BETWEEN $startDate AND $endDate",
              },
            ],
          },
        ],
      }),
    ).toBe(true);
  });

  it("detects the ? placeholder in non-sql queries, incl. nested aggregations", () => {
    expect(
      reportUsesDateRange({
        mode: "reporting",
        reportDefinition: [{ query: "Child:toArray[*isActive=true]" }],
      }),
    ).toBe(false);

    expect(
      reportUsesDateRange({
        mode: "exporting",
        reportDefinition: [
          {
            query: "EventNote:toArray",
            subQueries: [{ query: ".[* date >= ? & date <= ?]" }],
          },
        ],
      }),
    ).toBe(true);
  });
});
