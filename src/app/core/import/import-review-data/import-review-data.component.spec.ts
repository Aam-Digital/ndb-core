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
import { ImportSettings } from "../import-metadata";

describe("ImportReviewDataComponent", () => {
  let component: ImportReviewDataComponent;
  let fixture: ComponentFixture<ImportReviewDataComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["transformRawDataToEntities"]);
    mockImportService.transformRawDataToEntities.and.resolveTo([]);
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);

    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportReviewDataComponent],
      providers: [
        { provide: ImportService, useValue: mockImportService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportReviewDataComponent);
    component = fixture.componentInstance;

    component.importSettings = {
      entityType: TestEntity.ENTITY_TYPE,
    } as ImportSettings;

    fixture.detectChanges();
  });

  it("should parse data whenever it changes", fakeAsync(() => {
    const testEntities = [new TestEntity("1")];
    mockImportService.transformRawDataToEntities.and.resolveTo(testEntities);
    component.importSettings.columnMapping = [
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
});
