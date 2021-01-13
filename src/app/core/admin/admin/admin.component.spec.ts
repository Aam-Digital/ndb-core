import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { AdminComponent } from "./admin.component";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BackupService } from "../services/backup.service";
import { AppConfig } from "../../app-config/app-config";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialogRef } from "@angular/material/dialog";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const mockConfigService: jasmine.SpyObj<ConfigService> = jasmine.createSpyObj(
    ConfigService,
    ["exportConfig", "saveConfig", "loadConfig"]
  );
  const mockBackupService: jasmine.SpyObj<BackupService> = jasmine.createSpyObj(
    BackupService,
    [
      "getJsonExport",
      "getCsvExport",
      "clearDatabase",
      "importJson",
      "importCsv",
    ]
  );

  const confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService> = jasmine.createSpyObj(
    ConfirmationDialogService,
    ["openDialog"]
  );

  const tmplink: any = {
    href: "",
    target: "",
    download: "",
    click: () => {},
  };

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
    const mockDialogRef: jasmine.SpyObj<MatDialogRef<
      any
    >> = jasmine.createSpyObj("mockDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    return mockDialogRef;
  }

  beforeEach(async(() => {
    AppConfig.settings = {
      site_name: "",
      database: {
        name: "unit-tests",
        remote_url: "",
        timeout: 60000,
        useTemporaryDatabase: true,
      },
      webdav: { remote_url: "" },
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
        { provide: BackupService, useValue: mockBackupService },
        { provide: AppConfig, useValue: { load: () => {} } },
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["loadType", "save"]),
        },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call backup service for json export", () => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    component.saveBackup();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
  });

  it("should call backup service for csv export", () => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    mockBackupService.getCsvExport.and.returnValue(Promise.resolve(""));
    component.saveCsvExport();
    expect(mockBackupService.getCsvExport).toHaveBeenCalled();
  });

  it("should call config service for configuration export", () => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    component.downloadConfigClick();
    expect(mockConfigService.exportConfig).toHaveBeenCalled();
  });

  it("should save and apply new configuration", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("{}");
    mockConfigService.saveConfig.and.returnValue(Promise.resolve(null));
    component.uploadConfigFile(null);
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(mockConfigService.saveConfig).toHaveBeenCalled();
    expect(mockConfigService.loadConfig).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading backup", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    createDialogMock();

    component.loadBackup(null);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.importJson).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading csv", fakeAsync(() => {
    const mockFileReader = createFileReaderMock();
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(null));
    createDialogMock();

    component.loadCsv(null);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockBackupService.importCsv).toHaveBeenCalled();
  }));

  it("should open dialog when clearing database", fakeAsync(() => {
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    createDialogMock();

    component.clearDatabase();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
