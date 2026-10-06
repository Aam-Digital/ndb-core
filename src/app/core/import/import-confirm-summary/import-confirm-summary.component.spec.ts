import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportConfirmSummaryComponent } from "./import-confirm-summary.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ImportService, PartialImportError } from "../import.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ImportMetadata } from "../import-metadata";
import { of } from "rxjs";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

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
    mockDialogRef = mockMatDialogRef();
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
        {
          provide: EntityRegistry,
          useValue: { get: vi.fn() },
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
      expect(component.importInProgress()).toBe(false);
      expect(mockDialogRef.disableClose).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  describe("reporting a failed import", () => {
    const conflictRejection = [{ status: 409, name: "conflict" }];
    const historyEntry = () =>
      ImportMetadata.create({ createdEntities: ["1"], config: null });

    it.each([
      [
        "a conflict that stopped the import before anything was written",
        () => conflictRejection,
        "Conflicts overwriting updated data",
        "run import again",
        false,
      ],
      [
        "any other failure",
        () => new Error("Network error"),
        "Import failed",
        "Please try again",
        false,
      ],
      [
        "a write that stopped after saving part of the records",
        () =>
          new PartialImportError(
            "records",
            1,
            2,
            historyEntry(),
            new Error("request too large"),
          ),
        "Import only partially completed",
        "import history",
        true,
      ],
      [
        // the conflict advice alone would say to run the import again, which is
        // wrong once records have been written
        "a conflict that stopped the import after part of it was written",
        () =>
          new PartialImportError(
            "records",
            1,
            2,
            historyEntry(),
            conflictRejection,
          ),
        "Import only partially completed",
        "synchronisation",
        true,
      ],
      [
        "all records written but their additional linking failed",
        () =>
          new PartialImportError(
            "links",
            2,
            2,
            historyEntry(),
            new Error("offline"),
          ),
        "Import completed with errors",
        "import history",
        true,
      ],
      [
        "saved records that could not be recorded in the import history",
        () =>
          new PartialImportError(
            "records",
            1,
            2,
            undefined,
            new Error("request too large"),
          ),
        "Import only partially completed",
        "could not be recorded in the import history",
        true,
      ],
    ])(
      "should explain %s",
      async (
        _case,
        rejectWith,
        expectedTitle,
        expectedDetail,
        partiallyCompleted,
      ) => {
        mockImportService.executeImport.mockRejectedValue(rejectWith());

        await component.executeImport();

        expect(mockConfirmationService.getConfirmation).toHaveBeenCalledWith(
          expectedTitle,
          expect.stringContaining(expectedDetail),
          expect.anything(),
        );
        // records that are already written must not be offered for a plain retry,
        // so the review step is told them apart from a failure that wrote nothing
        expect(mockDialogRef.close).toHaveBeenCalledWith(
          expect.objectContaining({ errorOccured: true, partiallyCompleted }),
        );
        expect(component.importInProgress()).toBe(false);
        expect(mockDialogRef.disableClose).toBe(false);
      },
    );
  });
});
