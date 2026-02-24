import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ImportReviewDataComponent } from "./import-review-data.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { ImportService } from "../import.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Logging } from "../../logging/logging.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

describe("ImportReviewDataComponent", () => {
  let component: ImportReviewDataComponent;
  let fixture: ComponentFixture<ImportReviewDataComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["transformRawDataToEntities"]);
    mockImportService.transformRawDataToEntities.and.resolveTo({
      entities: [],
      errors: [],
    });
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportReviewDataComponent],
      providers: [
        { provide: ImportService, useValue: mockImportService },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportReviewDataComponent);
    component = fixture.componentInstance;

    component.entityType = TestEntity.ENTITY_TYPE;

    fixture.detectChanges();
  });

  it("should parse data whenever it changes", fakeAsync(() => {
    const testEntities = [new TestEntity("1")];
    mockImportService.transformRawDataToEntities.and.resolveTo({
      entities: testEntities,
      errors: [],
    });
    component.columnMapping = [
      { column: "x", propertyName: "name" },
      { column: "y", propertyName: undefined }, // unmapped property => not displayed
    ];

    component.ngOnChanges({});
    tick();

    expect(component.mappedEntities).toEqual(testEntities);
    expect(component.displayColumns).toEqual([
      component.IMPORT_STATUS_COLUMN,
      "name",
    ]);
  }));

  it("should open Summary Confirmation when clicking to start import", fakeAsync(() => {
    component.startImport();
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
  }));

  it("should handle errors from transformRawDataToEntities gracefully", fakeAsync(() => {
    mockImportService.transformRawDataToEntities.and.rejectWith(
      new Error("location lookup failed"),
    );
    spyOn(Logging, "error");

    component.columnMapping = [{ column: "x", propertyName: "name" }];
    component.ngOnChanges({});
    tick();

    expect(component.mappedEntities).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(Logging.error).toHaveBeenCalled();
  }));

  it("should show confirmation dialog and keep entities when user continues after transformation errors", fakeAsync(() => {
    const testEntities = [new TestEntity("1")];
    mockImportService.transformRawDataToEntities.and.resolveTo({
      entities: testEntities,
      errors: [
        {
          column: "address",
          propertyName: "location",
          rowIndex: 0,
          error: new Error("lookup failed"),
        },
      ],
    });
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    component.columnMapping = [{ column: "x", propertyName: "name" }];
    component.ngOnChanges({});
    tick();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.mappedEntities).toEqual(testEntities);
    expect(component.isLoading).toBeFalse();
  }));

  it("should show confirmation dialog and clear entities when user cancels after transformation errors", fakeAsync(() => {
    const testEntities = [new TestEntity("1")];
    mockImportService.transformRawDataToEntities.and.resolveTo({
      entities: testEntities,
      errors: [
        {
          column: "address",
          propertyName: "location",
          rowIndex: 0,
          error: new Error("lookup failed"),
        },
      ],
    });
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    component.columnMapping = [{ column: "x", propertyName: "name" }];
    component.ngOnChanges({});
    tick();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.mappedEntities).toEqual([]);
    expect(component.isLoading).toBeFalse();
  }));
});
