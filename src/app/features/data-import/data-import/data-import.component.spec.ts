import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from "@angular/core/testing";

import { DataImportComponent } from "./data-import.component";
import {BackupService} from "../../../core/admin/services/backup.service";
import {MatDialogRef} from "@angular/material/dialog";
import {ConfirmationDialogService} from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";
import {MatButtonModule} from "@angular/material/button";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {AppConfig} from "../../../core/app-config/app-config";
import {SessionType} from "../../../core/session/session-type";
import {DataImportService} from "../data-import.service";
import {of} from "rxjs";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;

  const mockDataImportService: jasmine.SpyObj<DataImportService> = jasmine.createSpyObj(
    DataImportService,
    [
      "importCsv"
    ]
  );

  const mockBackupService: jasmine.SpyObj<BackupService> = jasmine.createSpyObj(
    BackupService,
    [
      "getJsonExport",
      "clearDatabase",
      "importJson"
    ]
  );

  const confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService> = jasmine.createSpyObj(
    ConfirmationDialogService,
    ["openDialog"]
  );

  const mockSnackBar: jasmine.SpyObj<MatSnackBar> = jasmine.createSpyObj(
    MatSnackBar,
    ["open"]
  );

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

  function createSnackBarMock(): jasmine.SpyObj<MatSnackBarRef<any>> {
    const mockSnackBarRef: jasmine.SpyObj<
      MatSnackBarRef<any>
      > = jasmine.createSpyObj("mockSnackBarRef", ["onAction", "dismiss"]);
    mockSnackBarRef.dismiss.and.callThrough();
    mockSnackBarRef.onAction.and.callThrough();
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
          }
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    // confirmationDialogMock.openDialog.calls.reset();
    mockDataImportService.importCsv.calls.reset();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open dialog and call backup service and data-import service when loading csv", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(null));
    createDialogMock(true);

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
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(null));
    createDialogMock(false);

    component.loadCsv(null);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockDataImportService.importCsv).not.toHaveBeenCalled();
  }));

  xit("should restore database when undo button is clicked", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(null));
    mockBackupService.clearDatabase.and.callThrough();
    createDialogMock(true);
    const snackBarRef = createSnackBarMock();
    component.loadCsv(null);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    snackBarRef.onAction();
    //
    // flush();
    tick();
    // snackBarRef.dismiss();
    // flush();
    expect(snackBarRef.onAction).toHaveBeenCalled();
    //
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    // expect(mockBackupService.importJson).toHaveBeenCalled();
  }));
});
