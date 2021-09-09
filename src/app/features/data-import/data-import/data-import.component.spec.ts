import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from "@angular/core/testing";

import { DataImportComponent } from "./data-import.component";
import {BackupService} from "../../../core/admin/services/backup.service";
import {MatDialogRef} from "@angular/material/dialog";
import {of} from "rxjs";
import {ConfirmationDialogService} from "../../../core/confirmation-dialog/confirmation-dialog.service";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatButtonModule} from "@angular/material/button";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {AlertsModule} from "../../../core/alerts/alerts.module";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {AdminComponent} from "../../../core/admin/admin/admin.component";
import {AppConfig} from "../../../core/app-config/app-config";
import {SessionType} from "../../../core/session/session-type";
import {DataImportService} from "../data-import.service";

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
      "getCsvExport",
      "clearDatabase",
      "importJson"
    ]
  );

  const confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService> = jasmine.createSpyObj(
    ConfirmationDialogService,
    ["openDialog"]
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

  function createDialogMock(): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef: jasmine.SpyObj<
      MatDialogRef<any>
      > = jasmine.createSpyObj("mockDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    return mockDialogRef;
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
          HttpClientTestingModule,
          AlertsModule,
          NoopAnimationsModule,
        ],
        declarations: [AdminComponent],
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open dialog and call backup service and data-import service when loading csv", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(null));
    createDialogMock();

    component.loadCsv(null);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockDataImportService.importCsv).toHaveBeenCalled();
  }));
});
