import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ExportDialogComponent } from "./export-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DownloadService } from "../download-service/download.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ExportDialogComponent", () => {
  let component: ExportDialogComponent;
  let fixture: ComponentFixture<ExportDialogComponent>;
  let mockDownloadService: { triggerDownload: ReturnType<typeof vi.fn> };
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const dialogData = {
    allEntities: [{ id: 1 }, { id: 2 }],
    filteredData: [{ id: 1 }],
    exportConfig: undefined,
    filename: "TestExport",
  };

  beforeEach(async () => {
    mockDownloadService = {
      triggerDownload: vi.fn().mockResolvedValue(undefined),
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        ExportDialogComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DownloadService, useValue: mockDownloadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should default to csv format and filtered scope", () => {
    expect(component.format()).toBe("csv");
    expect(component.scope()).toBe("filtered");
  });

  it("should call triggerDownload with filteredData when scope is filtered", async () => {
    component.format.set("csv");
    component.scope.set("filtered");

    await component.download();

    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      dialogData.filteredData,
      "csv",
      dialogData.filename,
      dialogData.exportConfig,
    );
  });

  it("should call triggerDownload with allEntities when scope is all", async () => {
    component.format.set("xlsx");
    component.scope.set("all");

    await component.download();

    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      dialogData.allEntities,
      "xlsx",
      dialogData.filename,
      dialogData.exportConfig,
    );
  });

  it("should close the dialog after download", async () => {
    await component.download();

    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
