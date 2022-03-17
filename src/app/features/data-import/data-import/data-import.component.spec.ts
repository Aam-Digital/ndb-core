import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DynamicEntityService } from "../../../core/entity/dynamic-entity.service";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { DataImportModule } from "../data-import.module";
import { ParseResult } from "ngx-papaparse";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ImportMetaData } from "../import-meta-data.type";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

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

  beforeEach(
    waitForAsync(() => {
      mockDataImportService = jasmine.createSpyObj("DataImportService", [
        "handleCsvImport",
        "validateCsvFile",
      ]);
      TestBed.configureTestingModule({
        declarations: [DataImportComponent],
        imports: [
          DataImportModule,
          NoopAnimationsModule,
          FontAwesomeTestingModule,
        ],
        providers: [
          {
            provide: DataImportService,
            useValue: mockDataImportService,
          },
          {
            provide: DynamicEntityService,
            useValue: new DynamicEntityService(undefined, undefined),
          },
          {
            provide: DownloadService,
            useValue: jasmine.createSpyObj(["triggerDownload"]),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should update EntityType and transactionId form if import includes _id field", async () => {
    const parsed = {
      meta: { fields: ["_id", "name"] },
      data: [{ _id: "Child:1", name: "Test Child" }],
    } as ParseResult;
    mockDataImportService.validateCsvFile.and.resolveTo(parsed);
    const file = { name: "test.csv" } as File;
    await component.setCsvFile({ target: { files: [file] } } as any);

    expect(mockDataImportService.validateCsvFile).toHaveBeenCalledWith(file);
    expect(component.fileNameForm.get("fileName").value).toBe(file.name);
    const columns = Object.keys(component.columnMappingForm.getRawValue());
    expect(columns).toEqual(["_id", "name"]);
    expect(component.entityForm.get("entity").value).toBe("Child");
    expect(component.transactionIDForm.disabled).toBeTrue();
  });

  it("should only show properties that havent been used yet", fakeAsync(() => {
    component.entityForm.patchValue({ entity: "Child" });
    component.entitySelectionChanged();

    component.processChange("na");
    expect(component.filteredProperties.value).toEqual(["name"]);

    component.columnMappingForm.addControl("Name", new FormControl("name"));
    component.processChange("na");
    expect(component.filteredProperties.value).toEqual([]);
  }));

  it("should call import service with imported file and meta information", async () => {
    component.transactionIDForm.patchValue({
      transactionId: importMeta.transactionId,
    });
    component.entityForm.patchValue({ entity: importMeta.entityType });
    component.dateFormatForm.patchValue({ dateFormat: importMeta.dateFormat });
    component.columnMappingForm.registerControl(
      "Name",
      new FormControl("name")
    );
    component.columnMappingForm.registerControl(
      "PN",
      new FormControl("projectNumber")
    );
    const csvFile = { meta: { fields: [] } } as ParseResult;
    mockDataImportService.validateCsvFile.and.resolveTo(csvFile);
    await component.setCsvFile({ target: { files: [undefined] } } as any);

    await component.importSelectedFile();

    expect(mockDataImportService.handleCsvImport).toHaveBeenCalledWith(
      csvFile,
      importMeta
    );
  });

  it("should initialize forms when loading a config", async () => {
    mockFileReader(importMeta);
    component.columnMappingForm.addControl("Name", new FormControl());
    component.columnMappingForm.addControl("PN", new FormControl());

    await component.loadConfig({ target: { files: [undefined] } } as any);

    expect(component.entityForm.get("entity").value).toBe(
      importMeta.entityType
    );
    expect(component.transactionIDForm.get("transactionId").value).toBe(
      importMeta.transactionId
    );
    expect(component.dateFormatForm.get("dateFormat").value).toBe(
      importMeta.dateFormat
    );
    expect(component.columnMappingForm.getRawValue()).toEqual(
      importMeta.columnMap
    );
  });

  it("should have correct columns in the column map if a config for different/less columns has been imported", async () => {
    mockFileReader({
      columnMap: {
        existingColumn: "existing column value",
        missingColumn: "missing column value",
        existingEmptyColumn: null,
      },
      entityType: "Child",
    });
    component.columnMappingForm.addControl("existingColumn", new FormControl());
    component.columnMappingForm.addControl(
      "existingEmptyColumn",
      new FormControl()
    );
    component.columnMappingForm.addControl("newColumn", new FormControl());

    await component.loadConfig({ target: { files: [undefined] } } as any);

    expect(component.columnMappingForm.getRawValue()).toEqual({
      existingColumn: "existing column value",
      existingEmptyColumn: null,
      newColumn: null,
    });
  });

  it("should correctly initialize the entity type and available properties from the imported config", async () => {
    @DatabaseEntity("Testing")
    class Testing extends Entity {
      @DatabaseField() databaseString: string;
      @DatabaseField() databaseDate: Date;
      nonDatabaseString: string;
    }
    mockFileReader({ entityType: "Testing" });

    await component.loadConfig({ target: { files: [undefined] } } as any);

    expect(component.entityForm.get("entity").value).toBe("Testing");

    component.processChange("");
    expect(component.filteredProperties.value).toContain("databaseString");
    expect(component.filteredProperties.value).toContain("databaseDate");
    expect(component.filteredProperties.value).not.toContain(
      "nonDatabaseString"
    );
  });

  function mockFileReader(data: Partial<ImportMetaData>) {
    const fileReader: any = {
      result: JSON.stringify(data),
      addEventListener: (str: string, fun: () => any) => fun(),
      readAsText: () => {},
    };
    spyOn(window, "FileReader").and.returnValue(fileReader);
  }
});
