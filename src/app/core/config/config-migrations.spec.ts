import { describe, expect, it } from "vitest";
import { applyConfigMigrations } from "./config-migrations";

describe("applyConfigMigrations", () => {
  it("leaves a document with no legacy data unchanged", () => {
    const doc = { "entity:X": { label: "X", attributes: {} } };
    expect(applyConfigMigrations(doc)).toEqual(doc);
  });

  describe("migrateDashboardDefaultEntityType", () => {
    it.each([
      ["ChildrenCountDashboard", undefined, { entityType: "Child" }],
      ["EntityCountDashboard", {}, { entityType: "Child" }],
      [
        "NotesDashboard",
        { sinceDays: 28 },
        { sinceDays: 28, entityType: "Child" },
      ],
      [
        "EntityCountDashboard",
        { entityType: "School" },
        { entityType: "School" },
      ],
      ["NotesDashboard", { entityType: "School" }, { entityType: "School" }],
    ])(
      "sets the previously implicit Child entity of a %s widget unless one is configured (%j)",
      (component, config, expectedConfig) => {
        const old = { "view:": { component, config } };
        expect(applyConfigMigrations(old)).toEqual({
          "view:": { component, config: expectedConfig },
        });
      },
    );
  });
});
