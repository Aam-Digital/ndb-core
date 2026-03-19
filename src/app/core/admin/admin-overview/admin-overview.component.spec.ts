import { ComponentFixture, TestBed } from "@angular/core/testing";
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

  beforeEach(async () => {
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
  });

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

  it("should call backup service for json export", async () => {
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    await component.saveBackup();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });

  it("should call backup service for csv export", async () => {
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    await component.saveCsvExport();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });

  it("should call config service for configuration export", async () => {
    const exportConfigSpy = vi.spyOn(
      TestBed.inject(ConfigService),
      "exportConfig",
    );

    await component.downloadConfigClick();
    expect(exportConfigSpy).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });

  it("should save and apply new configuration", async () => {
    const mockFileReader = createFileReaderMock("{}");
    const saveConfigSpy = vi.spyOn(TestBed.inject(ConfigService), "saveConfig");
    saveConfigSpy.mockResolvedValue(null);
    await component.uploadConfigFile({ target: { files: [] } } as any);
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalled();
  });

  it("should open dialog and call backup service when loading backup", async () => {
    const mockFileReader = createFileReaderMock("[]");
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);

    await component.loadBackup({ target: { files: [] } } as any);
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.restoreData).toHaveBeenCalled();
  });

  it("should open dialog when clearing database", async () => {
    mockBackupService.getDatabaseExport.mockResolvedValue([]);
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);

    await component.clearDatabase();
    expect(mockBackupService.getDatabaseExport).toHaveBeenCalled();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  });
});
