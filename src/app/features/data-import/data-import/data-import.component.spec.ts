import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { BackupService } from "../../../core/admin/services/backup.service";
import { MatDialogRef } from "@angular/material/dialog";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AppConfig } from "../../../core/app-config/app-config";
import { SessionType } from "../../../core/session/session-type";
import { DataImportService } from "../data-import.service";
import {of} from "rxjs";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;

  let mockDataImportService: jasmine.SpyObj<DataImportService>;
  let mockBackupService: jasmine.SpyObj<BackupService>
  let confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  function createFileReaderMock(result: string = "") {
    const mockFileReader: any = {
      result: result,
      addEventListener: (str: string, fun: () => any) => fun(),
      readAsText: () => {},
    };
    spyOn(mockFileReader, "readAsText");
    // mock FileReader constructor
    spyOn(window, "FileReader").and.returnValue(mockFileReader);
    return mockFileReader;
  }

  function createDialogMock(confirm: boolean): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef: jasmine.SpyObj<
      MatDialogRef<any>
      > = jasmine.createSpyObj("mockDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(confirm));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    return mockDialogRef;
  }

  function createSnackBarMock(readable: boolean = false): jasmine.SpyObj<MatSnackBarRef<any>> {
    const mockSnackBarRef: jasmine.SpyObj<
      MatSnackBarRef<any>
      > = jasmine.createSpyObj("mockSnackBarRef", ["onAction"]);
    if (readable) {
      mockSnackBarRef.onAction.and.returnValue(of(null));
    } else {
      mockSnackBarRef.onAction.and.returnValue(of());
    }
    mockSnackBar.open.and.returnValue(mockSnackBarRef);
    return mockSnackBarRef;
  }

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = {
        site_name: "",
        session_type: SessionType.mock,
        database: {
          name: "unit-tests",
          remote_url: "",
        },
      };

      mockDataImportService = jasmine.createSpyObj(
        "DataImportService",
        [
          "importCsv"
        ]
      );
      mockBackupService = jasmine.createSpyObj(
        "BackupService",
        [
          "getJsonExport",
          "clearDatabase",
          "importJson"
        ]
      );
      confirmationDialogMock = jasmine.createSpyObj(
        "ConfirmationDialogService",
        ["openDialog"]
      );
      mockSnackBar = jasmine.createSpyObj(
        "MatSnackBar",
        ["open"]
      );

      TestBed.configureTestingModule({
        imports: [
          MatSnackBarModule,
          MatButtonModule,
          NoopAnimationsModule,
        ],
        declarations: [DataImportComponent],
        providers: [
          { provide: DataImportService, useValue: mockDataImportService },
          { provide: BackupService, useValue: mockBackupService },
          { provide: AppConfig, useValue: { load: () => {} } },
          {
            provide: ConfirmationDialogService,
            useValue: confirmationDialogMock,
          },
          {
            provide: MatSnackBar,
            useValue: mockSnackBar,
          }
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open dialog and call backup service and data-import service when loading csv", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.resolveTo(null);
    createDialogMock(true);
    createSnackBarMock();

    component.loadCsv(null);

    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockDataImportService.importCsv).toHaveBeenCalled();
  }));

  it("should open dialog and abort data-import when cancelled", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.resolveTo(null);
    createDialogMock(false);

    component.loadCsv(null);

    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockDataImportService.importCsv).not.toHaveBeenCalled();
  }));

  it("should restore database when undo button is clicked", fakeAsync(() => {
    createFileReaderMock();
    mockBackupService.getJsonExport.and.resolveTo("mockRestorePoint");
    mockBackupService.clearDatabase.and.callThrough();
    createDialogMock(true);
    createSnackBarMock(true);

    component.loadCsv(null);

    tick();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.importJson).toHaveBeenCalledWith("mockRestorePoint", true);
    flush();
  }));
});
