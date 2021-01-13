import {
  async,
  ComponentFixture,
  fakeAsync,
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
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    component.saveBackup();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
  });

  it("should call backup service for csv export", () => {
    mockBackupService.getCsvExport.and.returnValue(Promise.resolve(""));
    component.saveCsvExport();
    expect(mockBackupService.getCsvExport).toHaveBeenCalled();
  });

  it("should call config service for configuration export", () => {
    component.downloadConfigClick();
    expect(mockConfigService.exportConfig).toHaveBeenCalled();
  });

  it("should save and apply new configuration", fakeAsync(() => {
    mockConfigService.saveConfig.and.returnValue(Promise.resolve(null));
    component.uploadConfigFile(new Blob());
    tick();
    expect(mockConfigService.saveConfig).toHaveBeenCalled();
    tick();
    expect(mockConfigService.loadConfig).toHaveBeenCalled();
  }));

  it("should open dialog and call entity mapper when loading csv", fakeAsync(() => {
    const mockDialogRef = jasmine.createSpyObj("mockDialogRef", [
      "afterClosed",
    ]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    component.loadCsv(new Blob());
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    tick();
    expect(mockBackupService.importCsv).toHaveBeenCalled();
  }));

  it("should open dialog when clearing database", fakeAsync(() => {
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    const mockDialogRef = jasmine.createSpyObj("mockDialogRef", [
      "afterClosed",
    ]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    component.clearDatabase();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    tick();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
