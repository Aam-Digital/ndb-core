import { TestBed } from "@angular/core/testing";
import { ExportColumnsService } from "./export-columns.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { normalizeQueryKey } from "./data-transformation-service/export-column-config";
import { DefaultDatatype } from "../entity/default-datatype/default.datatype";
import { StringDatatype } from "../basic-datatypes/string/string.datatype";
import { DateWithAgeDatatype } from "../basic-datatypes/date-with-age/date-with-age.datatype";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../entity/entity-actions/entity-actions.service";

@DatabaseEntity("ExportColumnsTestEntity")
class ExportColumnsTestEntity extends Entity {
  @DatabaseField({ label: "Name" }) name: string;
  @DatabaseField({ label: "Date of birth", dataType: "date-with-age" })
  dateOfBirth: Date;
  @DatabaseField({
    label: "School",
    dataType: "entity",
    additional: "ExportColumnsTestEntity",
  })
  schoolId: string;
}

describe("ExportColumnsService", () => {
  let service: ExportColumnsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportColumnsService,
        EntitySchemaService,
        // only the datatypes of the test entity's schema, rather than a whole module
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: DateWithAgeDatatype,
          multi: true,
        },
        { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
        // EntityDatatype only uses these to resolve values, which the export column definitions don't
        { provide: EntityMapperService, useValue: {} },
        { provide: EntityActionsService, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });
    service = TestBed.inject(ExportColumnsService);
  });

  const queryKeys = (cols: { query: string }[]) =>
    cols.map((c) => normalizeQueryKey(c.query));

  it("should offer a dedicated age export column for date-with-age fields", () => {
    const { allAvailableColumns } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: [],
      availableColumns: [],
    });

    expect(queryKeys(allAvailableColumns)).toContain("dateOfBirth");
    expect(queryKeys(allAvailableColumns)).toContain("dateOfBirth_age");
  });

  it("should offer the human-readable name column for entity fields", () => {
    const { allAvailableColumns } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: [],
      availableColumns: [],
    });

    expect(queryKeys(allAvailableColumns)).toContain("schoolId");
    expect(queryKeys(allAvailableColumns)).toContain("schoolId_readable");
  });

  it("should label the raw entity id column distinctly so it can be selected on demand", () => {
    const { allAvailableColumns } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: [],
      availableColumns: [],
    });

    const idColumn = allAvailableColumns.find(
      (c) => normalizeQueryKey(c.query) === "schoolId",
    );
    expect(idColumn.label).toBe("School (internal id)");
  });

  it("should preselect both the age and date columns for a virtual DisplayAge column", () => {
    const { preselectedExportConfig } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: ["age"],
      availableColumns: [
        {
          id: "age",
          label: "Age",
          viewComponent: "DisplayAge",
          additional: "dateOfBirth",
        },
      ],
    });

    expect(queryKeys(preselectedExportConfig)).toContain("dateOfBirth_age");
    expect(queryKeys(preselectedExportConfig)).toContain("dateOfBirth");
    // the primary (age) column uses the label shown in the list view
    const ageColumn = preselectedExportConfig.find(
      (c) => normalizeQueryKey(c.query) === "dateOfBirth_age",
    );
    expect(ageColumn.label).toBe("Age");
  });

  it("should preselect both the readable name and the raw id for a visible entity field", () => {
    const { preselectedExportConfig } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: ["schoolId"],
      availableColumns: [],
    });

    expect(queryKeys(preselectedExportConfig)).toContain("schoolId_readable");
    expect(queryKeys(preselectedExportConfig)).toContain("schoolId");
    // the readable column uses the plain field label, the raw id is distinct
    const readableColumn = preselectedExportConfig.find(
      (c) => normalizeQueryKey(c.query) === "schoolId_readable",
    );
    const idColumn = preselectedExportConfig.find(
      (c) => normalizeQueryKey(c.query) === "schoolId",
    );
    expect(readableColumn.label).toBe("School");
    expect(idColumn.label).toBe("School (internal id)");
  });

  it("should offer and preselect a visible column that is not a schema field", () => {
    // e.g. a runtime-attached field like a Child's schoolId (populated by a loaderMethod)
    const { allAvailableColumns, preselectedExportConfig } =
      service.buildExportColumns({
        schema: ExportColumnsTestEntity.schema,
        visibleColIds: ["runtimeSchool"],
        availableColumns: [
          {
            id: "runtimeSchool",
            label: "School",
            viewComponent: "DisplayEntity",
          },
        ],
      });

    expect(queryKeys(allAvailableColumns)).toContain("runtimeSchool");
    const col = preselectedExportConfig.find(
      (c) => normalizeQueryKey(c.query) === "runtimeSchool",
    );
    expect(col.label).toBe("School");
  });

  it("should preselect the raw value for a visible plain field", () => {
    const { preselectedExportConfig } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: ["name"],
      availableColumns: [],
    });

    expect(queryKeys(preselectedExportConfig)).toEqual(["name"]);
  });
});
