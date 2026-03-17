import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportConfirmSummaryComponent } from "./import-confirm-summary.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ImportService } from "../import.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ImportMetadata } from "../import-metadata";
import { of } from "rxjs";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

describe("ImportConfirmSummaryComponent", () => {
  let component: ImportConfirmSummaryComponent;
  let fixture: ComponentFixture<ImportConfirmSummaryComponent>;

  let mockImportService: any;
  let mockSnackbar: any;
  let mockDialogRef: any;
  let mockConfirmationService: any;

  beforeEach(async () => {
    mockImportService = {
      executeImport: vi.fn(),
      undoImport: vi.fn(),
    };
    mockSnackbar = {
      open: vi.fn(),
    };
    mockSnackbar.open.mockReturnValue({ onAction: () => of(null) } as any);
    mockDialogRef = {
      close: vi.fn(),
    };
    mockConfirmationService = {
      getConfirmation: vi.fn(),
    };
    mockConfirmationService.getConfirmation.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ImportConfirmSummaryComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entitiesToImport: [], importSettings: {} },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackbar },
        { provide: ImportService, useValue: mockImportService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportConfirmSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should execute import via service, display toast message and close dialog upon success", async () => {
    vi.useFakeTimers();
    try {
      const testImportResult: ImportMetadata = ImportMetadata.create({
        createdEntities: ["1", "2"],
        config: null,
      });
      mockImportService.executeImport.mockResolvedValue(testImportResult);

      component.executeImport();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockImportService.executeImport).toHaveBeenCalled();
      expect(mockSnackbar.open).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        completedImport: testImportResult,
      });
      expect(component.importInProgress).toBe(false);
      expect(mockDialogRef.disableClose).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should close dialog with error flag for putAll conflict errors", async () => {
    const putAllConflictError = [{ status: 409, name: "conflict" }];
    mockImportService.executeImport.mockRejectedValue(putAllConflictError);

    await component.executeImport();

    expect(component.importInProgress).toBe(false);
    expect(mockDialogRef.disableClose).toBe(false);
    expect(mockConfirmationService.getConfirmation).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      errorOccured: true,
    });
  });

  it("should handle general errors with confirmation dialog and close dialog", async () => {
    const generalError = new Error("Network error");
    mockImportService.executeImport.mockRejectedValue(generalError);

    await component.executeImport();

    expect(component.importInProgress).toBe(false);
    expect(mockDialogRef.disableClose).toBe(false);
    expect(mockConfirmationService.getConfirmation).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      errorOccured: true,
    });
  });
});
