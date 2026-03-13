import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { AdminOverviewComponent } from "./admin-overview.component";
import { BackupService } from "../backup/backup.service";
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { SessionType } from "../../session/session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";
import { DownloadService } from "../../export/download-service/download.service";

describe("AdminComponent", () => {
  let component: AdminOverviewComponent;
  let fixture: ComponentFixture<AdminOverviewComponent>;

  const mockBackupService = {
    getDatabaseExport: vi.fn(),
    clearDatabase: vi.fn(),
    restoreData: vi.fn(),
  };
  let mockDownloadService: any;

  const confirmationDialogMock = {
    getConfirmation: vi.fn(),
  };

  function createFileReaderMock(result: string = "") {
    const readAsTextSpy = vi.fn();
    vi.stubGlobal(
      "FileReader",
      class {
        result = result;
        addEventListener(_str: string, fun: () => any) {
          fun();
        }
        readAsText() {
          readAsTextSpy();
        }
      },
    );
    return { readAsText: readAsTextSpy };
  }

  beforeEach(waitForAsync(() => {
    environment.session_type = SessionType.mock;
    mockDownloadService = {
      triggerDownload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdminOverviewComponent, MockedTestingModule.withState()],
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
    fixture = TestBed.createComponent(AdminOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call backup service for json export", fakeAsync(() => {
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    component.saveBackup();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  }));

  it("should call backup service for csv export", fakeAsync(() => {
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    component.saveCsvExport();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  }));

  it("should call config service for configuration export", fakeAsync(() => {
    const exportConfigSpy = vi.spyOn(
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
    const saveConfigSpy = vi.spyOn(TestBed.inject(ConfigService), "saveConfig");
    saveConfigSpy.mockResolvedValue(null);
    component.uploadConfigFile({ target: { files: [] } } as any);
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading backup", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("[]");
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);

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
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);

    component.clearDatabase();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
