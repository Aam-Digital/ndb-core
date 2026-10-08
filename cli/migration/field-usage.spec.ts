import { buildTestContext } from "./testing/migration-idempotency.harness.js";
import {
  countDocsWithFieldData,
  findConfigFieldReferences,
  findDocsReferencingField,
  findFieldReferences,
  findPermissionRolesMentioning,
  findQueryReportsMentioning,
  findSqlReportsMentioning,
  referencedConfigKeys,
  removeFieldFromConfig,
} from "./field-usage.js";

describe("field-usage", () => {
  describe("findFieldReferences", () => {
    it("finds list entries and other references in config parts about the entity type", () => {
      const config = {
        component: "EntityList",
        config: {
          entityType: "Todo",
          columns: ["subject", "assignedTo"],
          filters: [{ id: "assignedTo" }],
          groupBy: "assignedTo",
        },
      };

      expect(findFieldReferences(config, "Todo", "assignedTo")).toEqual([
        { path: ["config", "columns", "1"], removable: true },
        { path: ["config", "filters", "0"], removable: true },
        { path: ["config", "groupBy"], removable: false },
      ]);
    });

    it("ignores fields of the same name in config parts about other entity types", () => {
      const config = {
        entityType: "Child",
        panels: [
          { component: "TodosRelatedToEntity", config: { columns: ["name"] } },
          {
            component: "Form",
            config: { fieldGroups: [{ fields: ["name"] }] },
          },
        ],
      };

      expect(findFieldReferences(config, "Todo", "name")).toEqual([
        {
          path: ["panels", "0", "config", "columns", "0"],
          removable: true,
        },
      ]);
    });

    it("finds fields used as keys, e.g. prefilled values of a PublicFormConfig", () => {
      const form = {
        _id: "PublicFormConfig:x",
        entity: "Todo",
        prefilled: { assignedTo: { mode: "static" } },
      };

      expect(findFieldReferences(form, "Todo", "assignedTo")).toEqual([
        { path: ["prefilled", "assignedTo"], removable: false },
      ]);
      expect(findDocsReferencingField([form], "Todo", "assignedTo")).toEqual([
        "PublicFormConfig:x",
      ]);
    });
  });

  describe("findConfigFieldReferences", () => {
    it("recognizes entries by their key (also for a custom route) and skips the field definition", () => {
      const configData = {
        "entity:Todo": {
          route: "/tasks",
          toStringAttributes: ["subject", "assignedTo"],
          attributes: { assignedTo: { dataType: "entity" } },
        },
        // older formats without entityType
        "view:tasks": {
          component: "EntityList",
          config: { columns: ["assignedTo"] },
        },
        "view:tasks/:id": {
          component: "EntityDetails",
          config: { groupBy: "assignedTo" },
        },
        "view:todo": {
          component: "EntityList",
          config: { columns: ["assignedTo"] },
        },
      };

      const references = findConfigFieldReferences(
        configData,
        "Todo",
        "assignedTo",
      );

      expect(references).toEqual([
        { path: ["entity:Todo", "toStringAttributes", "1"], removable: true },
        { path: ["view:tasks", "config", "columns", "0"], removable: true },
        { path: ["view:tasks/:id", "config", "groupBy"], removable: false },
      ]);
      expect(referencedConfigKeys(references)).toEqual([
        "entity:Todo",
        "view:tasks",
        "view:tasks/:id",
      ]);
    });
  });

  describe("removeFieldFromConfig", () => {
    it("removes the field definition and all list entries referencing it", () => {
      const config = {
        data: {
          "entity:Todo": {
            attributes: { subject: {}, assignedTo: { dataType: "entity" } },
          },
          "view:todo": {
            component: "EntityList",
            config: {
              entityType: "Todo",
              columns: ["subject", "assignedTo"],
              filters: [{ id: "assignedTo" }],
            },
          },
        },
      };

      const result = removeFieldFromConfig(config, "Todo", "assignedTo");

      expect(result.remaining).toEqual([]);
      expect(result.data).toEqual({
        "entity:Todo": { attributes: { subject: {} } },
        "view:todo": {
          component: "EntityList",
          config: { entityType: "Todo", columns: ["subject"], filters: [] },
        },
      });
      // the given config is not modified
      expect(config.data["view:todo"].config.columns).toHaveLength(2);
    });

    it("returns only the remaining references if some cannot be removed", () => {
      const config = {
        data: {
          "view:todo": {
            component: "EntityList",
            config: {
              entityType: "Todo",
              columns: ["assignedTo"],
              groupBy: "assignedTo",
            },
          },
        },
      };

      const result = removeFieldFromConfig(config, "Todo", "assignedTo");

      expect(result.data).toBeUndefined();
      expect(result.remaining).toEqual([
        { path: ["view:todo", "config", "groupBy"], removable: false },
      ]);
    });
  });

  describe("findSqlReportsMentioning", () => {
    it("finds SQL reports mentioning the field as a whole word", () => {
      const reports = [
        {
          _id: "ReportConfig:a",
          mode: "sql",
          reportDefinition: [{ query: "SELECT assignedTo FROM Todo" }],
        },
        {
          _id: "ReportConfig:b",
          mode: "sql",
          reportDefinition: [{ query: "SELECT assignedToAll FROM Todo" }],
        },
        {
          _id: "ReportConfig:c",
          reportDefinition: [{ query: "Todo:toArray.assignedTo" }],
        },
      ];

      expect(findSqlReportsMentioning(reports, "assignedTo")).toEqual([
        "ReportConfig:a",
      ]);
    });
  });

  describe("findQueryReportsMentioning", () => {
    it("finds non-SQL reports whose queries mention the field as a whole word", () => {
      const reports = [
        {
          _id: "ReportConfig:a",
          mode: "reporting",
          reportDefinition: [
            {
              query: "Todo:toArray",
              aggregations: [{ query: "[*assignedTo=User:1]" }],
            },
          ],
        },
        {
          _id: "ReportConfig:b",
          reportDefinition: [
            { query: ".subject", subQueries: [{ query: ".assignedTo" }] },
          ],
        },
        {
          _id: "ReportConfig:c",
          mode: "sql",
          reportDefinition: [{ query: "SELECT assignedTo FROM Todo" }],
        },
        {
          _id: "ReportConfig:d",
          reportDefinition: [{ label: "assignedTo", query: ".assignedToAll" }],
        },
      ];

      expect(findQueryReportsMentioning(reports, "assignedTo")).toEqual([
        "ReportConfig:a",
        "ReportConfig:b",
      ]);
    });
  });

  describe("findPermissionRolesMentioning", () => {
    it("finds the roles with rules for the entity types whose conditions or fields mention the field", () => {
      const permissions = {
        _id: "Config:Permissions",
        data: {
          _default: [{ subject: "Todo", action: "read" }],
          user_app: [
            {
              subject: ["Todo", "Note"],
              action: "read",
              conditions: { assignedTo: "${user.entityId}" },
            },
          ],
          admin_app: [
            { subject: "all", action: "update", fields: ["assignedTo"] },
          ],
          other: [
            {
              subject: "Child",
              action: "read",
              conditions: { assignedTo: "x" },
            },
          ],
        },
      };

      expect(
        findPermissionRolesMentioning(permissions, ["Todo"], "assignedTo"),
      ).toEqual(["user_app", "admin_app"]);
      expect(
        findPermissionRolesMentioning(undefined, ["Todo"], "assignedTo"),
      ).toEqual([]);
    });
  });

  describe("countDocsWithFieldData", () => {
    it("counts docs of the entity type holding any value other than null or an empty array", async () => {
      const ctx = buildTestContext({
        "app/Todo:1": { _id: "Todo:1", assignedTo: ["User:1"], tags: [] },
        "app/Todo:2": { _id: "Todo:2", assignedTo: "User:1", tags: null },
        "app/Todo:3": { _id: "Todo:3", assignedTo: [] },
        "app/Note:1": { _id: "Note:1", assignedTo: ["User:1"], tags: ["x"] },
      });

      const result = await countDocsWithFieldData(ctx, "Todo", [
        "assignedTo",
        "tags",
      ]);

      expect(result.complete).toBe(true);
      expect(result.counts).toEqual(
        new Map([
          ["assignedTo", 2],
          ["tags", 0],
        ]),
      );
      expect(ctx.couchdb.find).toHaveBeenCalledTimes(1);
    });
  });
});
