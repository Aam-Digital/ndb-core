import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportConfirmSummaryComponent } from "./import-confirm-summary.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ImportService } from "../import.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ImportModule } from "../import.module";

describe("ImportConfirmSummaryComponent", () => {
  let component: ImportConfirmSummaryComponent;
  let fixture: ComponentFixture<ImportConfirmSummaryComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["executeImport", "undoImport"]);

    await TestBed.configureTestingModule({
      imports: [ImportModule],
      providers: [
        { provide: MatDialogRef, useValue: null },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatSnackBar, useValue: null },
        { provide: ImportService, useValue: mockImportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportConfirmSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
