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

describe("ImportConfirmSummaryComponent", () => {
  let component: ImportConfirmSummaryComponent;
  let fixture: ComponentFixture<ImportConfirmSummaryComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["executeImport", "undoImport"]);
    mockSnackbar = jasmine.createSpyObj(["open"]);
    mockSnackbar.open.and.returnValue({ onAction: () => of(null) } as any);
    mockDialogRef = jasmine.createSpyObj(["close"]);

    await TestBed.configureTestingModule({
      imports: [ImportConfirmSummaryComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackbar },
        { provide: ImportService, useValue: mockImportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportConfirmSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should execute import via service, display toast message and close dialog upon success", fakeAsync(() => {
    const testImportResult: ImportMetadata = ImportMetadata.create({
      ids: ["1", "2"],
      config: null,
    });
    mockImportService.executeImport.and.resolveTo(testImportResult);

    component.executeImport();
    tick();

    expect(mockImportService.executeImport).toHaveBeenCalled();
    expect(mockSnackbar.open).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  }));
});
