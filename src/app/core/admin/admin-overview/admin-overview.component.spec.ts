import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminOverviewComponent } from "./admin-overview.component";
import { BackupService } from "../backup/backup.service";
import { SystemResetService } from "../system-reset/system-reset.service";
import { LocalDeviceResetService } from "../../database/local-device-reset.service";
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { SessionType } from "../../session/session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";
import { DownloadService } from "../../export/download-service/download.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { JsonEditorService } from "../json-editor/json-editor.service";
import { of } from "rxjs";
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
  const mockJsonEditorService = {
    openJsonEditorDialog: vi.fn(),
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
        { provide: JsonEditorService, useValue: mockJsonEditorService },
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

  it("should call config service for configuration export", async () => {
    const exportConfigSpy = vi.spyOn(
      TestBed.inject(ConfigService),
      "exportConfig",
    );

    await component.downloadConfigClick();
    expect(exportConfigSpy).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });

  it("should save and apply new configuration when uploading a single config object", async () => {
    const mockFileReader = createFileReaderMock("{}");
    const saveConfigSpy = vi.spyOn(TestBed.inject(ConfigService), "saveConfig");
    saveConfigSpy.mockResolvedValue(null);
    await component.uploadConfigFile({ target: { files: [] } } as any);
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalled();
  });

  it("should bulk-save all docs when uploading an array of entity docs", async () => {
    const rawDocs = [
      { _id: "Config:CONFIG_ENTITY", _type: "Config", data: {} },
      {
        _id: "ConfigurableEnum:test-enum",
        _type: "ConfigurableEnum",
        label: "Test",
      },
    ];
    createFileReaderMock(JSON.stringify(rawDocs));

    const entityMapper = TestBed.inject(EntityMapperService);
    const mockEntity = new Entity("Config:CONFIG_ENTITY");
    vi.spyOn(entityMapper, "entityFromRawDoc").mockReturnValue(mockEntity);
    const saveAllSpy = vi.spyOn(entityMapper, "saveAll").mockResolvedValue([]);
    const saveConfigSpy = vi.spyOn(TestBed.inject(ConfigService), "saveConfig");

    await component.uploadConfigFile({ target: { files: [] } } as any);

    expect(entityMapper.entityFromRawDoc).toHaveBeenCalledTimes(rawDocs.length);
    expect(saveAllSpy).toHaveBeenCalledWith(
      expect.arrayContaining([mockEntity]),
      true,
    );
    expect(saveConfigSpy).not.toHaveBeenCalled();
  });

  it("should set isUploadingConfig signal to false after upload completes", async () => {
    createFileReaderMock("{}");
    vi.spyOn(TestBed.inject(ConfigService), "saveConfig").mockResolvedValue(
      null,
    );

    const uploadPromise = component.uploadConfigFile({
      target: { files: [] },
    } as any);
    expect(component.isUploadingConfig()).toBe(true);
    await uploadPromise;
    expect(component.isUploadingConfig()).toBe(false);
  });

  it("should show success snackbar after uploading configuration", async () => {
    createFileReaderMock("{}");
    vi.spyOn(TestBed.inject(ConfigService), "saveConfig").mockResolvedValue(
      null,
    );
    const snackBarSpy = vi.spyOn(TestBed.inject(MatSnackBar), "open");

    await component.uploadConfigFile({ target: { files: [] } } as any);

    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining("updated"),
      undefined,
      expect.any(Object),
    );
  });

  it("should show error snackbar and reset signal if upload fails", async () => {
    createFileReaderMock("{}");
    vi.spyOn(TestBed.inject(ConfigService), "saveConfig").mockRejectedValue(
      new Error("DB error"),
    );
    const snackBarSpy = vi.spyOn(TestBed.inject(MatSnackBar), "open");

    await component.uploadConfigFile({ target: { files: [] } } as any);

    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed"),
      undefined,
      expect.any(Object),
    );
    expect(component.isUploadingConfig()).toBe(false);
  });

  it("should save a backup and the edited configuration when the JSON editor is confirmed", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(
      of({ some: "updated data" }),
    );
    const entityMapper = TestBed.inject(EntityMapperService);
    const saveSpy = vi.spyOn(entityMapper, "save").mockResolvedValue(null);
    const saveConfigSpy = vi
      .spyOn(TestBed.inject(ConfigService), "saveConfig")
      .mockResolvedValue(null);

    component.editConfig();

    await vi.waitFor(() => expect(saveConfigSpy).toHaveBeenCalled());
    expect(saveSpy).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalledWith({ some: "updated data" });
  });

  it("should not save anything when the JSON editor is cancelled", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(of(undefined));
    const saveConfigSpy = vi.spyOn(TestBed.inject(ConfigService), "saveConfig");

    component.editConfig();
    await Promise.resolve();

    expect(saveConfigSpy).not.toHaveBeenCalled();
  });

  it("should show an error snackbar instead of failing silently when saving the edited configuration fails", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(
      of({ some: "updated data" }),
    );
    vi.spyOn(TestBed.inject(EntityMapperService), "save").mockResolvedValue(
      null,
    );
    vi.spyOn(TestBed.inject(ConfigService), "saveConfig").mockRejectedValue(
      new Error("not permitted"),
    );
    const snackBarSpy = vi.spyOn(TestBed.inject(MatSnackBar), "open");

    component.editConfig();

    await vi.waitFor(() =>
      expect(snackBarSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
        undefined,
        expect.any(Object),
      ),
    );
  });

  it("should still close the progress dialog when reverting a configuration change fails", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(
      of({ some: "updated data" }),
    );
    vi.spyOn(TestBed.inject(EntityMapperService), "save").mockResolvedValue(
      null,
    );
    vi.spyOn(TestBed.inject(ConfigService), "saveConfig")
      .mockResolvedValueOnce(null) // initial save while editing
      .mockRejectedValueOnce(new Error("not permitted")); // revert on undo
    const progressDialogRef = mockMatDialogRef();
    confirmationDialogMock.showProgressDialog.mockReturnValue(
      progressDialogRef,
    );
    // simulate the user clicking "Undo" as soon as the snackbar appears
    vi.spyOn(TestBed.inject(MatSnackBar), "open").mockReturnValue({
      onAction: () => of(undefined),
    } as any);

    component.editConfig();

    await vi.waitFor(() => expect(progressDialogRef.close).toHaveBeenCalled());
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
