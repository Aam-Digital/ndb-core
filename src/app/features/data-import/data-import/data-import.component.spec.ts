import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
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
      Name: { label: "Name", key: "name" },
      PN: { key: "projectNumber", label: "Project Number" },
    },
  };

  beforeEach(() => {
    mockDataImportService = jasmine.createSpyObj("DataImportService", [
      "handleCsvImport",
      "validateCsvFile",
      "getLinkableEntityTypes",
    ]);
    mockDataImportService.getLinkableEntityTypes.and.returnValue([]);
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

    const columns = Object.keys(component.columnMap);
    expect(columns).toEqual(["_id", "name"]);
    expect(component.entityForm).toHaveValue("Child");
    expect(component.transactionIDForm).not.toBeEnabled();
  });

  it("should only show properties that have not been used yet", () => {
    mockCsvFileLoaded();
    component.entityForm.patchValue("Child");
    component.entitySelectionChanged();

    component.processChange("", "Project");
    expect(component.filteredProperties.value).toEqual([
      { key: "projectNumber", label: "Project Number" },
    ]);

    component.selectOption("Project", "PN");
    component.processChange("", "Project");
    expect(component.filteredProperties.value).toEqual([]);
  });

  it("should initialize forms when loading a config", async () => {
    mockCsvFileLoaded();
    component.columnMap["Name"] = undefined;
    component.columnMap["PN"] = undefined;

    await component.loadConfig({ data: importMeta } as ParseResult);

    expect(component.entityForm).toHaveValue(importMeta.entityType);
    expect(component.transactionIDForm).toHaveValue(importMeta.transactionId);
    expect(component.dateFormatForm).toHaveValue(importMeta.dateFormat);
    expect(component.columnMap).toEqual(importMeta.columnMap);
  });

  it("should have correct columns in the column map if a config for different/less columns has been imported", async () => {
    const configFileContents = {
      columnMap: {
        existingColumn: {
          key: "existing_column_value",
          label: "Existing column value",
        },
        missingColumn: {
          key: "missing_column_value",
          label: "Missing column value",
        },
        existingEmptyColumn: undefined,
      },
      entityType: "Child",
    };
    mockCsvFileLoaded();
    component.columnMap["existingColumn"] = undefined;
    component.columnMap["existingEmptyColumn"] = undefined;
    component.columnMap["newColumn"] = undefined;

    await component.loadConfig({ data: configFileContents } as ParseResult);

    expect(component.columnMap).toEqual({
      existingColumn: {
        key: "existing_column_value",
        label: "Existing column value",
      },
      existingEmptyColumn: undefined,
      newColumn: undefined,
    });
  });

  it("should correctly initialize the entity type and available properties from the imported config", async () => {
    mockCsvFileLoaded();

    @DatabaseEntity("Testing")
    class Testing extends Entity {
      @DatabaseField({ label: "String" }) databaseString: string;
      @DatabaseField({ label: "Date" }) databaseDate: Date;
      nonDatabaseString: string;
    }

    await component.loadConfig({
      data: { entityType: "Testing" },
    } as ParseResult);

    expect(component.entityForm).toHaveValue("Testing");

    component.processChange("", "");
    expect(component.filteredProperties.value).toContain({
      key: "databaseString",
      label: "String",
    });
    expect(component.filteredProperties.value).toContain({
      key: "databaseDate",
      label: "Date",
    });
    expect(component.filteredProperties.value).not.toContain(
      jasmine.objectContaining({ key: "nonDatabaseString" })
    );
  });

  it("automatically selects column mappings if column and property name is identical", async () => {
    @DatabaseEntity("TestInferredMapping")
    class Testing extends Entity {
      @DatabaseField({ label: "Test Property" }) testProperty: string;
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

    const actualColumnMap = component.columnMap;
    expect(actualColumnMap.testProperty).toEqual({
      key: "testProperty",
      label: "Test Property",
    });
    expect(actualColumnMap.unknownColumn).toBe(undefined);
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
