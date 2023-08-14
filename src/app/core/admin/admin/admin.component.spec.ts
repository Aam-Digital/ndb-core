import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { AdminComponent } from "./admin.component";
import { BackupService } from "../services/backup.service";
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { SessionType } from "../../session/session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";
import { DownloadService } from "../../export/download-service/download.service";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const mockBackupService = jasmine.createSpyObj<BackupService>([
    "getDatabaseExport",
    "clearDatabase",
    "restoreData",
  ]);
  let mockDownloadService: jasmine.SpyObj<DownloadService>;

  const confirmationDialogMock =
    jasmine.createSpyObj<ConfirmationDialogService>(["getConfirmation"]);

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

  beforeEach(waitForAsync(() => {
    environment.session_type = SessionType.mock;
    mockDownloadService = jasmine.createSpyObj(["triggerDownload"]);

    TestBed.configureTestingModule({
      imports: [AdminComponent, MockedTestingModule.withState()],
      providers: [
        { provide: BackupService, useValue: mockBackupService },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: DownloadService, useValue: mockDownloadService },
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

  it("should call backup service for json export", fakeAsync(() => {
    mockBackupService.getDatabaseExport.and.resolveTo([]);
    component.saveBackup();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  }));

  it("should call backup service for csv export", fakeAsync(() => {
    mockBackupService.getDatabaseExport.and.resolveTo([]);
    component.saveCsvExport();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  }));

  it("should call config service for configuration export", fakeAsync(() => {
    const exportConfigSpy = spyOn(
      TestBed.inject(ConfigService),
      "exportConfig",
    );

    component.downloadConfigClick();
    expect(exportConfigSpy).toHaveBeenCalled();
    tick();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  }));

  it("should save and apply new configuration", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("{}");
    const saveConfigSpy = spyOn(TestBed.inject(ConfigService), "saveConfig");
    saveConfigSpy.and.resolveTo(null);
    component.uploadConfigFile({ target: { files: [] } } as any);
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading backup", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("[]");
    mockBackupService.getDatabaseExport.and.resolveTo([]);
    confirmationDialogMock.getConfirmation.and.resolveTo(true);

    component.loadBackup({ target: { files: [] } } as any);
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.restoreData).toHaveBeenCalled();
  }));

  it("should open dialog when clearing database", fakeAsync(() => {
    mockBackupService.getDatabaseExport.and.resolveTo([]);
    confirmationDialogMock.getConfirmation.and.resolveTo(true);

    component.clearDatabase();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
