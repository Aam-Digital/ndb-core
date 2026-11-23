import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminOverviewComponent } from "./admin-overview.component";
import { BackupService } from "../backup/backup.service";
import { SystemResetService } from "../system-reset/system-reset.service";
import { LocalDeviceResetService } from "../../database/local-device-reset.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { SessionType } from "../../session/session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";
import { DownloadService } from "../../export/download-service/download.service";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

describe("AdminComponent", () => {
  let component: AdminOverviewComponent;
  let fixture: ComponentFixture<AdminOverviewComponent>;

  const mockBackupService = {
    getDatabaseExport: vi.fn(),
    clearDatabase: vi.fn(),
    restoreData: vi.fn(),
  };
  const mockLocalDeviceResetService = {
    resetLocalDevice: vi.fn(),
  };
  const mockSystemResetService = {
    emptyRecords: vi.fn(),
    resetSystem: vi.fn(),
  };
  let mockDownloadService: any;

  const confirmationDialogMock = {
    getConfirmation: vi.fn(),
    getConfirmationWithKeyword: vi.fn(),
    showProgressDialog: vi.fn().mockReturnValue(mockMatDialogRef()),
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
    // the mocks above are shared across tests, so their recorded calls have to be reset
    vi.clearAllMocks();

    environment.session_type = SessionType.mock;
    mockDownloadService = {
      triggerDownload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdminOverviewComponent, MockedTestingModule.withState()],
      providers: [
        { provide: BackupService, useValue: mockBackupService },
        { provide: SystemResetService, useValue: mockSystemResetService },
        {
          provide: LocalDeviceResetService,
          useValue: mockLocalDeviceResetService,
        },
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

  // detailed behavior of these bulk-delete actions is covered by SystemResetService's own spec
  it("should delegate emptying records to the system reset service", async () => {
    await component.emptyRecords();

    expect(mockSystemResetService.emptyRecords).toHaveBeenCalled();
  });

  it("should delegate resetting the system to the system reset service", async () => {
    await component.resetSystem();

    expect(mockSystemResetService.resetSystem).toHaveBeenCalled();
  });

  it("should delegate resetting the local device to the local device reset service", async () => {
    await component.resetLocalDevice();

    expect(mockLocalDeviceResetService.resetLocalDevice).toHaveBeenCalled();
  });
});
