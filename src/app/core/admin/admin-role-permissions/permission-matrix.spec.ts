import { matrixToRules, rulesToMatrix } from "./permission-matrix";
import { DatabaseRule } from "../../permissions/permission-types";

describe("permission-matrix", () => {
  it("fans out subject and action arrays into per-subject rows and per-action cells", () => {
    const model = rulesToMatrix([
      { subject: ["Child", "School"], action: "read" },
      { subject: "Note", action: ["read", "create"] },
    ]);

    expect(model.rows.map((r) => r.subject)).toEqual([
      "Child",
      "School",
      "Note",
    ]);
    expect(model.rows[0].cells.read).toEqual({ allowed: true });
    expect(model.rows[2].cells.read).toEqual({ allowed: true });
    expect(model.rows[2].cells.create).toEqual({ allowed: true });
    expect(model.rows[2].cells.update).toBeUndefined();
  });

  it("keeps conditions per cell and flags manage as its own cell", () => {
    const model = rulesToMatrix([
      { subject: "Child", action: "read", conditions: { center: "alipore" } },
      { subject: "ReportConfig", action: "manage" },
      { subject: "all", action: "manage" },
    ]);

    expect(model.rows[0].cells.read).toEqual({
      allowed: true,
      conditions: { center: "alipore" },
    });
    expect(model.rows[1].cells.manage).toEqual({ allowed: true });
    expect(model.rows[2].subject).toBe("all");
    expect(model.rows[2].cells.manage).toEqual({ allowed: true });
  });

  it("merges multiple rules for the same subject with later rules winning per cell", () => {
    const model = rulesToMatrix([
      { subject: "Child", action: ["read", "update"] },
      { subject: "Child", action: "read", conditions: { center: "x" } },
    ]);

    expect(model.rows.length).toBe(1);
    expect(model.rows[0].cells.read).toEqual({
      allowed: true,
      conditions: { center: "x" },
    });
    expect(model.rows[0].cells.update).toEqual({ allowed: true });
  });

  it("collects inverted and field-restricted rules as unsupported and re-emits them unchanged", () => {
    const inverted: DatabaseRule = {
      subject: "Child",
      action: "delete",
      inverted: true,
    };
    const fieldRestricted: DatabaseRule = {
      subject: "School",
      action: "update",
      fields: ["name"],
    };

    const model = rulesToMatrix([
      { subject: "Child", action: "read" },
      inverted,
      fieldRestricted,
    ]);

    expect(model.unsupportedRules).toEqual([inverted, fieldRestricted]);
    expect(model.rows.map((r) => r.subject)).toEqual(["Child"]);

    const rules = matrixToRules(model);
    expect(rules).toContainEqual(inverted);
    expect(rules).toContainEqual(fieldRestricted);
  });

  it("round-trips typical grouped config rules without changing them", () => {
    const rules: DatabaseRule[] = [
      { subject: ["Child", "School"], action: "read" },
      { subject: "Note", action: ["read", "create"] },
      { subject: "all", action: "manage" },
      { subject: "Child", action: "update", conditions: { center: "x" } },
    ];

    const result = matrixToRules(rulesToMatrix(rules));

    expect(result).toHaveLength(rules.length);
    expect(result).toEqual(expect.arrayContaining(rules));
  });

  it("groups actions with identical conditions into one rule when converting back", () => {
    const model = rulesToMatrix([
      {
        subject: "Child",
        action: ["read", "update"],
        conditions: { center: "x" },
      },
    ]);

    expect(matrixToRules(model)).toEqual([
      {
        subject: "Child",
        action: ["read", "update"],
        conditions: { center: "x" },
      },
    ]);
  });
});
