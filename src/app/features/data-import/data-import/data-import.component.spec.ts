import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { FormControl } from "@angular/forms";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { ParseResult } from "ngx-papaparse";
import { ImportMetaData } from "../import-meta-data.type";
import { Entity } from "../../../core/entity/model/entity";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ParsedData } from "../input-file/input-file.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;
  let mockDataImportService: jasmine.SpyObj<DataImportService>;
  const importMeta: ImportMetaData = {
    transactionId: "transId",
    entityType: "Child",
    dateFormat: "MM-DD-YYYY",
    columnMap: {
      Name: "name",
      PN: "projectNumber",
    },
  };

  beforeEach(() => {
    mockDataImportService = jasmine.createSpyObj("DataImportService", [
      "handleCsvImport",
      "validateCsvFile",
    ]);
    TestBed.configureTestingModule({
      imports: [DataImportComponent, MockedTestingModule],
      providers: [
        {
          provide: DataImportService,
          useValue: mockDataImportService,
        },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        {
          provide: DownloadService,
          useValue: jasmine.createSpyObj(["triggerDownload"]),
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should update EntityType and transactionId form if import includes _id field", async () => {
    const parsed = {
      fields: ["_id", "name"],
      data: [{ _id: "Child:1", name: "Test Child" }],
    } as ParsedData;
    await component.loadData(parsed);

    const columns = Object.keys(component.columnMappingForm.getRawValue());
    expect(columns).toEqual(["_id", "name"]);
    expect(component.entityForm.get("entity")).toHaveValue("Child");
    expect(component.transactionIDForm).not.toBeEnabled();
  });

  it("should only show properties that have not been used yet", fakeAsync(() => {
    mockCsvFileLoaded();
    component.entityForm.patchValue({ entity: "Child" });
    component.entitySelectionChanged();

    component.processChange("na");
    expect(component.filteredProperties.value).toEqual(["name"]);

    component.columnMappingForm.addControl("Name", new FormControl("name"));
    component.processChange("na");
    expect(component.filteredProperties.value).toEqual([]);
  }));

  it("should initialize forms when loading a config", async () => {
    mockCsvFileLoaded();
    component.columnMappingForm.addControl("Name", new FormControl());
    component.columnMappingForm.addControl("PN", new FormControl());

    await component.loadConfig({ data: importMeta } as ParseResult);

    expect(component.entityForm.get("entity")).toHaveValue(
      importMeta.entityType
    );
    expect(component.transactionIDForm.get("transactionId")).toHaveValue(
      importMeta.transactionId
    );
    expect(component.dateFormatForm.get("dateFormat")).toHaveValue(
      importMeta.dateFormat
    );
    expect(component.columnMappingForm.getRawValue()).toEqual(
      importMeta.columnMap
    );
  });

  it("should have correct columns in the column map if a config for different/less columns has been imported", async () => {
    const configFileContents = {
      columnMap: {
        existingColumn: "existing column value",
        missingColumn: "missing column value",
        existingEmptyColumn: null,
      },
      entityType: "Child",
    };
    mockCsvFileLoaded();
    component.columnMappingForm.addControl("existingColumn", new FormControl());
    component.columnMappingForm.addControl(
      "existingEmptyColumn",
      new FormControl()
    );
    component.columnMappingForm.addControl("newColumn", new FormControl());

    await component.loadConfig({ data: configFileContents } as ParseResult);

    expect(component.columnMappingForm.getRawValue()).toEqual({
      existingColumn: "existing column value",
      existingEmptyColumn: null,
      newColumn: null,
    });
  });

  it("should correctly initialize the entity type and available properties from the imported config", async () => {
    mockCsvFileLoaded();

    @DatabaseEntity("Testing")
    class Testing extends Entity {
      @DatabaseField() databaseString: string;
      @DatabaseField() databaseDate: Date;
      nonDatabaseString: string;
    }

    await component.loadConfig({
      data: { entityType: "Testing" },
    } as ParseResult);

    expect(component.entityForm.get("entity")).toHaveValue("Testing");

    component.processChange("");
    expect(component.filteredProperties.value).toContain("databaseString");
    expect(component.filteredProperties.value).toContain("databaseDate");
    expect(component.filteredProperties.value).not.toContain(
      "nonDatabaseString"
    );
  });

  it("automatically selects column mappings if column and property name is identical", async () => {
    @DatabaseEntity("TestInferredMapping")
    class Testing extends Entity {
      @DatabaseField() testProperty: string;
      @DatabaseField() testOther: string;
    }

    const parsed = {
      fields: ["_id", "unknownColumn", "testProperty"],
      data: [
        {
          _id: "TestInferredMapping:1",
          unknownColumn: "foo",
          testProperty: "x",
        },
      ],
    } as ParsedData;

    await component.loadData(parsed);

    const actualColumnMap = component.columnMappingForm.getRawValue();
    expect(actualColumnMap.testProperty).toBe("testProperty");
    expect(actualColumnMap.unknownColumn).toBe(null);
    expect(actualColumnMap["testOther"]).toBe(undefined);
  });

  /**
   * put component into state like a csv file has been loaded to test later phases of import
   */
  function mockCsvFileLoaded(mockCsvFields = []) {
    component.importData = {
      data: undefined,
      fields: mockCsvFields,
    };
  }
});
