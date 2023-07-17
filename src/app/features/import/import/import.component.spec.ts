import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportComponent } from "./import.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { Papa } from "ngx-papaparse";
import { ColumnMapping } from "../column-mapping";
import { ParsedData } from "../../../core/input-file/input-file.component";
import { ImportMetadata } from "../import-metadata";

describe("ImportComponent", () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;

  let testDataRaw: ParsedData<any>;

  beforeEach(async () => {
    const parseResult = new Papa().parse("x,y\na,1\nb,2", { header: true });
    testDataRaw = {
      data: parseResult.data,
      fields: parseResult.meta.fields,
    };

    await TestBed.configureTestingModule({
      imports: [ImportModule, MockedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should reset state after executing import", () => {
    const confirmationDialog = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialog, "getConfirmation");
    component.entityType = "Child";
    component.rawData = [{ test: "data" }];
    component.columnMapping = [{ column: "test", propertyName: "name" }];
    component.additionalImportActions = [{ type: "x", id: "y" }];

    component.stepper.next();
    component.onImportCompleted(null);

    expect(component.entityType).toBeUndefined();
    expect(component.rawData).toBeUndefined();
    expect(component.columnMapping).toBeUndefined();
    expect(component.additionalImportActions).toBeUndefined();

    expect(component.mappedColumnsCount).toBeUndefined();
    expect(component.stepper.selectedIndex).toBe(0);
    expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
  });

  it("should update an empty column mapping upon loading rawData", () => {
    component.mappedColumnsCount = 5; // simulating previous count

    component.onDataLoaded(testDataRaw);

    expect(component.rawData).toEqual(testDataRaw.data);
    expect(component.columnMapping).toEqual([
      { column: "x", propertyName: undefined },
      { column: "y", propertyName: undefined },
    ] as ColumnMapping[]);
    expect(component.mappedColumnsCount).toBe(0);
  });

  function testApplyColumnMapping(
    appliedMapping: ColumnMapping[],
    expectedMapping: ColumnMapping[],
    expectedMappingCount: number
  ) {
    component.applyPreviousMapping(
      ImportMetadata.create({
        config: {
          entityType: "Child",
          columnMapping: appliedMapping,
          additionalActions: [],
        },
        ids: [],
      })
    );

    expect(component.columnMapping).toEqual(expectedMapping);
    expect(component.mappedColumnsCount).toBe(expectedMappingCount);
  }

  it("should apply historic column mapping", () => {
    component.mappedColumnsCount = 5; // simulating previous count
    component.columnMapping = [{ column: "x" }, { column: "y" }];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  });

  it("should apply historic column mapping - overwriting existing mappings", () => {
    component.columnMapping = [
      { column: "x", propertyName: "projectNumber" },
      { column: "y" },
    ];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  });

  it("should apply historic column mapping - keeping rawData columns not included in applied mapping but resetting them", () => {
    component.columnMapping = [
      { column: "x" },
      { column: "y", propertyName: "projectNumber" },
    ];
    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      // no mapping for "y" applied (=> was not available or ignored in previous import)
    ];

    testApplyColumnMapping(
      loadedMapping,
      [
        { column: "x", propertyName: "name" },
        { column: "y", propertyName: undefined },
      ],
      1
    );
  });

  it("should apply historic column mapping - removing columns not part of current raw data", () => {
    component.rawData = testDataRaw.data;
    component.columnMapping = [{ column: "x" }, { column: "y" }];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "otherColumn", propertyName: "projectNumber" },
      // currently not filtered: { column: "y", propertyName: "propertyNotExistingOnEntity" },
    ];

    testApplyColumnMapping(
      loadedMapping,
      [
        { column: "x", propertyName: "name" },
        { column: "y", propertyName: undefined },
      ],
      1
    );
  });
});
