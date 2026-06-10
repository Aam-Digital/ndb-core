import { TestBed } from "@angular/core/testing";
import { ExportColumnsService } from "./export-columns.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { normalizeQueryKey } from "./data-transformation-service/export-column-config";

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
      imports: [MockedTestingModule.withState()],
      providers: [ExportColumnsService, EntitySchemaService],
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

  it("should preselect the raw value for a visible plain field", () => {
    const { preselectedExportConfig } = service.buildExportColumns({
      schema: ExportColumnsTestEntity.schema,
      visibleColIds: ["name"],
      availableColumns: [],
    });

    expect(queryKeys(preselectedExportConfig)).toEqual(["name"]);
  });
});
