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

  describe("migrateMinMaxToRangeValidators", () => {
    it.each([
      [{ min: 0, max: 100 }, { range: { min: 0, max: 100 } }],
      [{ maxDate: "$now" }, { dateRange: { max: "$now" } }],
      [
        { minAge: 6, maxAge: 18, required: true },
        { required: true, ageRange: { min: 6, max: 18 } },
      ],
      [
        { min: 0, max: 10, _warningOnly: ["min", "max", "pattern"] },
        { range: { min: 0, max: 10 }, _warningOnly: ["pattern", "range"] },
      ],
      [
        { min: 0, max: 10, _warningOnly: ["max"] },
        { range: { min: 0, max: 10 }, _warningOnly: [] },
      ],
      [{ range: { min: 1 } }, { range: { min: 1 } }],
    ])("turns the validators %j into %j", (validators, expected) => {
      const old = {
        "entity:X": { attributes: { field: { validators } } },
      };
      expect(applyConfigMigrations(old)).toEqual({
        "entity:X": { attributes: { field: { validators: expected } } },
      });
    });

    it("also migrates the validators of inner fields of embedded entries", () => {
      const old = {
        attributes: {
          list: { additional: { count: { validators: { max: 5 } } } },
        },
      };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: {
          list: {
            additional: { count: { validators: { range: { max: 5 } } } },
          },
        },
      });
    });
  });
});
