import { describe, expect, it } from "vitest";
import { applyConfigMigrations } from "./config-migrations";

describe("applyConfigMigrations", () => {
  it("leaves a document with no legacy data unchanged", () => {
    const doc = { "entity:X": { label: "X", attributes: {} } };
    expect(applyConfigMigrations(doc)).toEqual(doc);
  });

  it("removes the deprecated exportConfig from view configs", () => {
    const old = {
      "view:note": {
        component: "EntityList",
        config: {
          entityType: "Note",
          columns: ["subject"],
          exportConfig: [{ query: "subject", label: "Subject" }],
        },
      },
    };
    expect(applyConfigMigrations(old)).toEqual({
      "view:note": {
        component: "EntityList",
        config: { entityType: "Note", columns: ["subject"] },
      },
    });
  });

  describe("migrateChildrenListConfig", () => {
    it("migrates ChildrenList component to EntityList", () => {
      const old = { "view:X": { component: "ChildrenList", config: {} } };
      expect(applyConfigMigrations(old)).toEqual({
        "view:X": {
          component: "EntityList",
          config: { entityType: "Child", loaderMethod: "ChildrenService" },
        },
      });
    });

    it("is idempotent", () => {
      const migrated = {
        "view:X": {
          component: "EntityList",
          config: { entityType: "Child", loaderMethod: "ChildrenService" },
        },
      };
      expect(applyConfigMigrations(migrated)).toEqual(migrated);
    });
  });

  describe("migrateHistoricalDataComponent", () => {
    it("migrates HistoricalDataComponent to RelatedEntities", () => {
      const old = {
        "view:X": { component: "HistoricalDataComponent", config: {} },
      };
      expect(applyConfigMigrations(old)).toEqual({
        "view:X": {
          component: "RelatedEntities",
          config: {
            entityType: "HistoricalEntityData",
            loaderMethod: "HistoricalDataService",
          },
        },
      });
    });
  });

  describe("migrateEntityArrayDatatype", () => {
    it("migrates entity-array dataType", () => {
      const old = { attributes: { field: { dataType: "entity-array" } } };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: { field: { dataType: "entity", isArray: true } },
      });
    });

    it("migrates array dataType with innerDataType", () => {
      const old = {
        attributes: {
          field: { dataType: "array", innerDataType: "month" },
        },
      };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: { field: { dataType: "month", isArray: true } },
      });
    });

    it("replaces DisplayEntityArray component string", () => {
      const old = { viewComponent: "DisplayEntityArray" };
      expect(applyConfigMigrations(old)).toEqual({
        viewComponent: "DisplayEntity",
      });
    });
  });

  describe("migrateEntityDetailsInputEntityType", () => {
    it("renames config.entity to config.entityType", () => {
      const old = { config: { entity: "Child", columns: ["name"] } };
      expect(applyConfigMigrations(old)).toEqual({
        config: { entityType: "Child", columns: ["name"] },
      });
    });
  });

  describe("migrateEntitySchemaDefaultValue + migrateDefaultValue", () => {
    it("migrates a raw string default value to fully-structured config", () => {
      // migrateEntitySchemaDefaultValue converts the string to {mode, value},
      // then migrateDefaultValue wraps value into a config sub-object.
      const old = { attributes: { field: { defaultValue: "some-value" } } };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: {
          field: {
            defaultValue: { mode: "static", config: { value: "some-value" } },
          },
        },
      });
    });

    it("migrates $now placeholder to dynamic config format", () => {
      const old = { attributes: { field: { defaultValue: "$now" } } };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: {
          field: {
            defaultValue: { mode: "dynamic", config: { value: "$now" } },
          },
        },
      });
    });

    it("leaves an already fully-migrated defaultValue unchanged", () => {
      const already = {
        attributes: {
          field: {
            defaultValue: { mode: "static", config: { value: "x" } },
          },
        },
      };
      expect(applyConfigMigrations(already)).toEqual(already);
    });
  });

  describe("migratePhotoDatatype", () => {
    it("migrates file+EditPhoto to photo dataType", () => {
      const old = {
        attributes: {
          photo: {
            dataType: "file",
            editComponent: "EditPhoto",
            label: "Photo",
          },
          doc: { dataType: "file", label: "Doc" },
        },
      };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: {
          photo: { dataType: "photo", label: "Photo" },
          doc: { dataType: "file", label: "Doc" },
        },
      });
    });
  });

  describe("migratePercentageDatatype", () => {
    it("migrates number+DisplayPercentage to percentage dataType", () => {
      const old = {
        attributes: {
          pct: {
            dataType: "number",
            viewComponent: "DisplayPercentage",
            editComponent: "EditNumber",
          },
          num: { dataType: "number" },
        },
      };
      expect(applyConfigMigrations(old)).toEqual({
        attributes: {
          pct: { dataType: "percentage" },
          num: { dataType: "number" },
        },
      });
    });
  });

  describe("migrateLegacyIdFilters", () => {
    it("strips .id suffix from OR-filter keys", () => {
      const old = {
        prefilter: {
          $or: [{ "status.id": "A" }, { "status.id": "B" }, { name: "Test" }],
        },
      };
      expect(applyConfigMigrations(old)).toEqual({
        prefilter: {
          $or: [{ status: "A" }, { status: "B" }, { name: "Test" }],
        },
      });
    });
  });

  describe("migrateGroupByConfig", () => {
    it("wraps string groupBy into an array", () => {
      const old = {
        component: "EntityCountDashboard",
        config: { entityType: "Child", groupBy: "center" },
      };
      expect(applyConfigMigrations(old)).toEqual({
        component: "EntityCountDashboard",
        config: { entityType: "Child", groupBy: ["center"] },
      });
    });
  });
});
