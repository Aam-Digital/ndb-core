import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { EntityDatatype } from "./entity.datatype";
import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { DatabaseException } from "../../database/pouchdb/database-exception";

describe("Schema data type: entity", () => {
  testDatatype(EntityDatatype, "1", "1", "User");

  // keep undefined and null unchanged
  testDatatype(EntityDatatype, undefined, undefined, "User");
  testDatatype(EntityDatatype, null, null, "User");

  describe("export readable column", () => {
    let datatype: EntityDatatype;
    let mockEntityMapper: { load: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockEntityMapper = {
        load: vi.fn(),
      };

      TestBed.configureTestingModule({
        providers: [
          EntityDatatype,
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: EntityActionsService, useValue: { anonymize: vi.fn() } },
          {
            provide: EntitySchemaService,
            useValue: { transformEntityToDatabaseFormat: vi.fn() },
          },
          { provide: EntityRegistry, useValue: new EntityRegistry() },
        ],
      });

      datatype = TestBed.inject(EntityDatatype);
    });

    it("should use schemaField.additional for unprefixed ids", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");

      mockEntityMapper.load.mockResolvedValue({
        toString: () => "Alice",
      });

      const result = await readableColumn.resolveValue("child-1", schemaField);

      expect(mockEntityMapper.load).toHaveBeenCalledWith("Child", "child-1");
      expect(result).toEqual(["Alice"]);
    });

    it("should export <not_found> when referenced entity cannot be loaded", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");

      mockEntityMapper.load.mockResolvedValue(undefined);

      const result = await readableColumn.resolveValue("child-1", schemaField);

      expect(result).toEqual(["<not_found>"]);
    });

    it("should export <not_found> when referenced entity does not exist (404)", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");

      mockEntityMapper.load.mockRejectedValue(
        new DatabaseException({ message: "missing", status: 404 }),
      );

      const result = await readableColumn.resolveValue("child-1", schemaField);

      expect(result).toEqual(["<not_found>"]);
    });

    it("should fail instead of exporting <not_found> on a transient connection error", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");

      mockEntityMapper.load.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(
        readableColumn.resolveValue("Child:child-1", schemaField),
      ).rejects.toThrow("Failed to fetch");
    });

    it("should load each referenced entity only once per export context", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");
      mockEntityMapper.load.mockResolvedValue({ toString: () => "Alice" });
      const context = { entityNameCache: new Map() };

      await readableColumn.resolveValue("Child:1", schemaField, context);
      const result = await readableColumn.resolveValue(
        ["Child:1", "Child:1"],
        schemaField,
        context,
      );

      expect(result).toEqual(["Alice", "Alice"]);
      expect(mockEntityMapper.load).toHaveBeenCalledTimes(1);
    });

    it("should not cache a failed load, so it can be retried", async () => {
      const schemaField: EntitySchemaField = {
        id: "relatedEntity",
        dataType: "entity",
        label: "Related Entity",
        additional: "Child",
      };
      const readableColumn = datatype
        .getExportColumns(schemaField)
        .find((column) => column.keySuffix === "_readable");
      const context = { entityNameCache: new Map() };
      mockEntityMapper.load
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({ toString: () => "Alice" });

      await expect(
        readableColumn.resolveValue("Child:1", schemaField, context),
      ).rejects.toThrow();
      const result = await readableColumn.resolveValue(
        "Child:1",
        schemaField,
        context,
      );

      expect(result).toEqual(["Alice"]);
    });
  });
});
