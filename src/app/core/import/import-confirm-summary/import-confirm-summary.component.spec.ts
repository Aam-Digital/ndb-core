import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

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

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["executeImport", "undoImport"]);
    mockSnackbar = jasmine.createSpyObj(["open"]);
    mockSnackbar.open.and.returnValue({ onAction: () => of(null) } as any);
    mockDialogRef = jasmine.createSpyObj(["close"]);
    mockConfirmationService = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationService.getConfirmation.and.resolveTo(true);

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

  it("should execute import via service, display toast message and close dialog upon success", fakeAsync(() => {
    const testImportResult: ImportMetadata = ImportMetadata.create({
      createdEntities: ["1", "2"],
      config: null,
    });
    mockImportService.executeImport.and.resolveTo(testImportResult);

    component.executeImport();
    tick();

    expect(mockImportService.executeImport).toHaveBeenCalled();
    expect(mockSnackbar.open).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      completedImport: testImportResult,
    });
    expect(component.importInProgress).toBeFalse();
    expect(mockDialogRef.disableClose).toBeFalse();
  }));

  it("should close dialog with error flag for putAll conflict errors", async () => {
    const putAllConflictError = [{ status: 409, name: "conflict" }];
    mockImportService.executeImport.and.rejectWith(putAllConflictError);

    await component.executeImport();

    expect(component.importInProgress).toBeFalse();
    expect(mockDialogRef.disableClose).toBeFalse();
    expect(mockConfirmationService.getConfirmation).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      errorOccured: true,
    });
  });

  it("should handle general errors with confirmation dialog and close dialog", async () => {
    const generalError = new Error("Network error");
    mockImportService.executeImport.and.rejectWith(generalError);

    await component.executeImport();

    expect(component.importInProgress).toBeFalse();
    expect(mockDialogRef.disableClose).toBeFalse();
    expect(mockConfirmationService.getConfirmation).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      errorOccured: true,
    });
  });
});
