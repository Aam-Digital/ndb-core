import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportComponent } from "./import.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { ColumnMapping } from "../column-mapping";
import { ParsedData } from "../../common-components/parsed-file-input/parsed-file-input.component";
import { ImportMetadata } from "../import-metadata";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { Router } from "@angular/router";
import { parse } from "papaparse";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("ImportComponent", () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;

  let testDataRaw: ParsedData<any>;
  const mockLocation = {} as Location;

  beforeEach(async () => {
    vi.useRealTimers();

    const parseResult = parse("x,y\na,1\nb,2", { header: true });
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
    vi.spyOn(confirmationDialog, "getConfirmation");
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");
    navigateSpy.mockResolvedValue(undefined);
    mockLocation.pathname = "/import";
    component.rawData = [{ test: "data" }];
    component.importSettings.set({
      entityType: "Child",
      columnMapping: [{ column: "test", propertyName: "name" }],
      additionalActions: [
        {
          targetType: "x",
          targetProperty: "xx",
          targetId: "y",
          sourceType: "Child",
          mode: "direct",
        },
      ],
    });

    component.stepper.next();
    await component.onImportCompleted();

    expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([""], expect.anything());
    expect(navigateSpy).toHaveBeenCalledWith(["/import"], expect.anything());
  });

  it("should flag missing create permission for the selected import type", () => {
    const ability = TestBed.inject(EntityAbility);
    ability.update([
      { subject: "all", action: "manage" },
      { subject: "Child", action: "create", inverted: true },
    ]);
    ability.initialized = true;

    component.importSettings.set({ entityType: "Child" });
    expect(component.cannotCreateSelectedType()).toBe(true);

    component.importSettings.set({ entityType: "School" });
    expect(component.cannotCreateSelectedType()).toBe(false);
  });

  it("should update an empty column mapping upon loading rawData", async () => {
    component.onDataLoaded(testDataRaw);

    expect(component.rawData).toEqual(testDataRaw.data);
    expect(component.importSettings().columnMapping).toEqual([
      { column: "x", propertyName: undefined },
      { column: "y", propertyName: undefined },
    ] as ColumnMapping[]);
    expect(component.mappedColumnsCount()).toBe(0);
  });

  async function testApplyColumnMapping(
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

    expect(component.importSettings().columnMapping).toEqual(expectedMapping);
    expect(component.mappedColumnsCount()).toBe(expectedMappingCount);
  }

  it("should apply historic column mapping", async () => {
    component.importSettings.set({
      columnMapping: [{ column: "x" }, { column: "y" }],
    });

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    await testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  });

  it("should apply historic column mapping - overwriting existing mappings", async () => {
    component.importSettings.set({
      columnMapping: [
        { column: "x", propertyName: "projectNumber" },
        { column: "y" },
      ],
    });

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: "projectNumber" },
    ];

    await testApplyColumnMapping(loadedMapping, loadedMapping, 2);
  });

  it("should apply historic column mapping - keeping rawData columns not included in applied mapping but resetting them", async () => {
    component.importSettings.set({
      columnMapping: [
        { column: "x" },
        { column: "y", propertyName: "projectNumber" },
      ],
    });
    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      // no mapping for "y" applied (=> was not available or ignored in previous import)
    ];

    await testApplyColumnMapping(
      loadedMapping,
      [{ column: "x", propertyName: "name" }, { column: "y" }],
      1,
    );
  });

  it("should apply historic column mapping - removing columns not part of current raw data", async () => {
    component.rawData = testDataRaw.data;
    component.importSettings.set({
      columnMapping: [{ column: "x" }, { column: "y" }],
    });

    const loadedMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      { column: "otherColumn", propertyName: "projectNumber" },
      // currently not filtered: { column: "y", propertyName: "propertyNotExistingOnEntity" },
    ];

    await testApplyColumnMapping(
      loadedMapping,
      [{ column: "x", propertyName: "name" }, { column: "y" }],
      1,
    );
  });
});
