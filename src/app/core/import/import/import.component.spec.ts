import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ImportComponent } from "./import.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { Papa } from "ngx-papaparse";
import { ColumnMapping } from "../column-mapping";
import { ParsedData } from "../../common-components/input-file/input-file.component";
import { ImportMetadata } from "../import-metadata";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { Router } from "@angular/router";

describe("ImportComponent", () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;

  let testDataRaw: ParsedData<any>;
  const mockLocation = {} as Location;

  beforeEach(async () => {
    const parseResult = new Papa().parse("x,y\na,1\nb,2", { header: true });
    testDataRaw = {
      data: parseResult.data,
      fields: parseResult.meta.fields,
    };

    await TestBed.configureTestingModule({
      imports: [ImportComponent, MockedTestingModule.withState()],
      providers: [{ provide: LOCATION_TOKEN, useValue: mockLocation }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should trigger navigation after executing import", async () => {
    const confirmationDialog = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialog, "getConfirmation");
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    navigateSpy.and.resolveTo();
    mockLocation.pathname = "/import";
    component.rawData = [{ test: "data" }];
    component.importSettings = {
      entityType: "Child",
      columnMapping: [{ column: "test", propertyName: "name" }],
      additionalActions: [
        {
          targetEntityType: "x",
          targetProperty: "xx",
          targetId: "y",
          sourceType: "Child",
          mode: "direct",
        },
      ],
    };

    component.stepper.next();
    await component.onImportCompleted();

    expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([""], jasmine.anything());
    expect(navigateSpy).toHaveBeenCalledWith(["/import"], jasmine.anything());
  });

  it("should update an empty column mapping upon loading rawData", fakeAsync(() => {
    component.mappedColumnsCount = 5; // simulating previous count

    component.onDataLoaded(testDataRaw);
    tick();

    expect(component.rawData).toEqual(testDataRaw.data);
    expect(component.importSettings.columnMapping).toEqual([
      { column: "x", propertyName: undefined },
      { column: "y", propertyName: undefined },
    ] as ColumnMapping[]);
    expect(component.mappedColumnsCount).toBe(0);
  }));

  function testApplyColumnMapping(
    appliedMapping: ColumnMapping[],
    expectedMapping: ColumnMapping[],
    expectedMappingCount: number,
  ) {
    component.applyPreviousMapping(
      ImportMetadata.create({
        config: {
          entityType: "Child",
          columnMapping: appliedMapping,
          additionalActions: [],
        },
        createdEntities: [],
      }),
    );
    tick();

    expect(component.importSettings.columnMapping).toEqual(expectedMapping);
    expect(component.mappedColumnsCount).toBe(expectedMappingCount);
  }

  it("should apply historic column mapping", fakeAsync(() => {
    component.mappedColumnsCount = 5; // simulating previous count
    component.importSettings.columnMapping = [{ column: "x" }, { column: "y" }];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  }));

  it("should apply historic column mapping - overwriting existing mappings", fakeAsync(() => {
    component.importSettings.columnMapping = [
      { column: "x", propertyName: "projectNumber" },
      { column: "y" },
    ];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  }));

  it("should apply historic column mapping - keeping rawData columns not included in applied mapping but resetting them", fakeAsync(() => {
    component.importSettings.columnMapping = [
      { column: "x" },
      { column: "y", propertyName: "projectNumber" },
    ];
    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      // no mapping for "y" applied (=> was not available or ignored in previous import)
    ];

    testApplyColumnMapping(
      loadedMapping,
      [{ column: "x", propertyName: "name" }, { column: "y" }],
      1,
    );
  }));

  it("should apply historic column mapping - removing columns not part of current raw data", fakeAsync(() => {
    component.rawData = testDataRaw.data;
    component.importSettings.columnMapping = [{ column: "x" }, { column: "y" }];

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "otherColumn", propertyName: "projectNumber" },
      // currently not filtered: { column: "y", propertyName: "propertyNotExistingOnEntity" },
    ];

    testApplyColumnMapping(
      loadedMapping,
      [{ column: "x", propertyName: "name" }, { column: "y" }],
      1,
    );
  }));
});
