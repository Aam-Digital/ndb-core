import { buildAuditFilter as build } from "./audit-filter";
import { ChangeHistoryFilters } from "./change-history.types";

/** the built selector, which is an untyped Mango object at the database edge */
function buildAuditFilter(filters: ChangeHistoryFilters): Record<string, any> {
  return build(filters) as Record<string, any>;
}

describe("buildAuditFilter", () => {
  it("should exclude baselines, which are snapshots rather than changes", () => {
    expect(buildAuditFilter({})).toEqual({
      timestamp: { $gt: null },
      operation: { $ne: "baseline" },
    });
  });

  it("should constrain the sort field even with no date range, so the index is usable", () => {
    expect(buildAuditFilter({}).timestamp).toEqual({ $gt: null });
  });

  it("should narrow to one operation when an action is selected", () => {
    expect(buildAuditFilter({ action: "deleted" }).operation).toBe("delete");
  });

  it("should match a record type as a prefix range on the stored id", () => {
    expect(buildAuditFilter({ entityType: "Child" }).entityId).toEqual({
      $gte: "Child:",
      $lt: "Child:￰",
    });
  });

  it("should include the whole of the selected end day", () => {
    const filter = buildAuditFilter({
      from: new Date("2026-08-01T09:00:00.000Z"),
      to: new Date("2026-08-31T09:00:00.000Z"),
    });

    expect(filter.timestamp.$gte).toBe("2026-08-01T09:00:00.000Z");
    // a midnight bound would drop every change made on the last day
    expect(new Date(filter.timestamp.$lte).getTime()).toBeGreaterThan(
      new Date("2026-08-31T09:00:00.000Z").getTime(),
    );
  });

  it("should match the author however the backend recorded them", () => {
    // a token without a name leaves every record identified by id alone
    expect(buildAuditFilter({ changedBy: "User:demo" }).$or).toEqual([
      { "user.name": "User:demo" },
      { "user.id": "User:demo" },
    ]);
  });

  it("should leave an unset filter unrestricted", () => {
    const filter = buildAuditFilter({
      entityType: undefined,
      changedBy: undefined,
      action: undefined,
    });

    expect(filter.entityId).toBeUndefined();
    expect(filter.$or).toBeUndefined();
    expect(filter.operation).toEqual({ $ne: "baseline" });
  });
});
