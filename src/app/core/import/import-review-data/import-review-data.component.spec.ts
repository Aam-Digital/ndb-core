import { ComponentFixture, TestBed } from "@angular/core/testing";

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

  let mockImportService: any;
  let mockDialog: any;
  let mockConfirmationDialog: any;

  beforeEach(async () => {
    mockImportService = {
      transformRawDataToEntities: vi.fn(),
    };
    mockImportService.transformRawDataToEntities.mockResolvedValue({
      entities: [],
      errors: [],
    });
    mockDialog = {
      open: vi.fn(),
    };
    mockDialog.open.mockReturnValue({ afterClosed: () => of({}) } as any);
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };
    mockConfirmationDialog.getConfirmation.mockResolvedValue(true);

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

  it("should parse data whenever it changes", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
        entities: testEntities,
        errors: [],
      });
      component.columnMapping = [
        { column: "x", propertyName: "name" },
        { column: "y", propertyName: undefined }, // unmapped property => not displayed
      ];
      component.stepIsFocused = true;

      component.ngOnChanges({
        columnMapping: {} as any,
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.mappedEntities()).toEqual(testEntities);
      expect(component.displayColumns()).toEqual([
        component.IMPORT_STATUS_COLUMN,
        "name",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should open Summary Confirmation when clicking to start import", async () => {
    vi.useFakeTimers();
    try {
      component.startImport();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialog.open).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle errors from transformRawDataToEntities gracefully", async () => {
    vi.useFakeTimers();
    try {
      mockImportService.transformRawDataToEntities.mockRejectedValue(
        new Error("location lookup failed"),
      );
      vi.spyOn(Logging, "error");

      component.columnMapping = [{ column: "x", propertyName: "name" }];
      component.stepIsFocused = true;
      component.ngOnChanges({
        columnMapping: {} as any,
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.mappedEntities()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(Logging.error).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show confirmation dialog and keep entities when user continues after transformation errors", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
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
      mockConfirmationDialog.getConfirmation.mockResolvedValue(true);

      component.columnMapping = [{ column: "x", propertyName: "name" }];
      component.stepIsFocused = true;
      component.ngOnChanges({
        columnMapping: {} as any,
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual(testEntities);
      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should continue preview even if transformation dialog resolves false", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
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
      mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

      component.columnMapping = [{ column: "x", propertyName: "name" }];
      component.stepIsFocused = true;
      component.ngOnChanges({
        columnMapping: {} as any,
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual(testEntities);
      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show confirmation dialog when preview becomes visible with errors", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
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
      component.stepIsFocused = false;

      component.columnMapping = [{ column: "x", propertyName: "name" }];
      // Simulate data change and then making preview visible
      component.ngOnChanges({
        columnMapping: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      // Data changed but preview not visible yet - should NOT parse yet
      expect(
        mockImportService.transformRawDataToEntities,
      ).not.toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual([]);

      // Now show the preview
      component.stepIsFocused = true;
      component.ngOnChanges({
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      // Should parse now and show the confirmation dialog for errors
      expect(mockImportService.transformRawDataToEntities).toHaveBeenCalled();
      expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual(testEntities);
      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should delay parsing until preview is visible for performance", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
        entities: testEntities,
        errors: [],
      });
      component.stepIsFocused = false;

      // Change data while preview is not visible
      component.columnMapping = [{ column: "x", propertyName: "name" }];
      component.ngOnChanges({
        columnMapping: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      // Should NOT parse yet
      expect(
        mockImportService.transformRawDataToEntities,
      ).not.toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual([]);

      // Make preview visible
      component.stepIsFocused = true;
      component.ngOnChanges({
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockImportService.transformRawDataToEntities).toHaveBeenCalled();
      expect(component.mappedEntities()).toEqual(testEntities);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not re-parse when only navigating away and back without data changes", async () => {
    vi.useFakeTimers();
    try {
      const testEntities = [new TestEntity("1")];
      mockImportService.transformRawDataToEntities.mockResolvedValue({
        entities: testEntities,
        errors: [],
      });
      component.stepIsFocused = true;
      component.columnMapping = [{ column: "x", propertyName: "name" }];

      // Initial parse when data changes and preview is visible
      component.ngOnChanges({
        columnMapping: {} as any,
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(
        mockImportService.transformRawDataToEntities,
      ).toHaveBeenCalledTimes(1);
      mockImportService.transformRawDataToEntities.mockClear();

      // Navigate away from preview
      component.stepIsFocused = false;
      component.ngOnChanges({
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      // Navigate back to preview (no data changes)
      component.stepIsFocused = true;
      component.ngOnChanges({
        showErrorDialog: {} as any,
      });
      await vi.advanceTimersByTimeAsync(0);

      // Should NOT re-parse since data hasn't changed
      expect(
        mockImportService.transformRawDataToEntities,
      ).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
