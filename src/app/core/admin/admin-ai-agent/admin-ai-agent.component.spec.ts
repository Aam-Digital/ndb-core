import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminAiAgentComponent } from "./admin-ai-agent.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { DownloadService } from "../../export/download-service/download.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Config } from "../../config/config";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { SiteSettings } from "../../site-settings/site-settings";
import { ReportEntity } from "#src/app/features/reporting/report-config";
import { PublicFormConfig } from "#src/app/features/public-form/public-form-config";
import { ConfigService } from "../../config/config.service";
import { Entity } from "../../entity/model/entity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { JsonEditorService } from "../json-editor/json-editor.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";
import { of } from "rxjs";

describe("AdminAiAgentComponent", () => {
  let component: AdminAiAgentComponent;
  let fixture: ComponentFixture<AdminAiAgentComponent>;
  let mockEntityMapper: Record<
    "loadType" | "load" | "entityFromRawDoc" | "saveAll" | "save" | "remove",
    ReturnType<typeof vi.fn>
  >;
  let mockConfigService: Record<
    "exportConfig" | "saveConfig",
    ReturnType<typeof vi.fn>
  >;
  let mockDownloadService: { triggerDownload: ReturnType<typeof vi.fn> };

  const configurableEnumDocument = { sentinel: "configurable-enum" };
  const siteSettingsDocument = { sentinel: "site-settings" };
  const reportDocument = { sentinel: "report" };
  const publicFormDocument = { sentinel: "public-form" };

  const mockJsonEditorService = { openJsonEditorDialog: vi.fn() };
  const confirmationDialogMock = {
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
    vi.clearAllMocks();
    mockEntityMapper = {
      loadType: vi.fn().mockName("EntityMapperService.loadType"),
      load: vi.fn().mockName("EntityMapperService.load"),
      entityFromRawDoc: vi.fn(),
      saveAll: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };
    mockConfigService = {
      exportConfig: vi.fn().mockReturnValue("{}"),
      saveConfig: vi.fn(),
    };
    mockEntityMapper.loadType.mockImplementation((entityType) => {
      if (entityType === ConfigurableEnum) {
        return Promise.resolve([configurableEnumDocument]);
      }
      if (entityType === ReportEntity) {
        return Promise.resolve([reportDocument]);
      }
      if (entityType === PublicFormConfig) {
        return Promise.resolve([publicFormDocument]);
      }
      if (entityType === SiteSettings) {
        return Promise.resolve([siteSettingsDocument]);
      }
      return Promise.resolve([]);
    });
    mockEntityMapper.load.mockImplementation(() => Promise.resolve(null));

    mockDownloadService = {
      triggerDownload: vi.fn().mockName("DownloadService.triggerDownload"),
    };
    mockDownloadService.triggerDownload.mockReturnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [
        AdminAiAgentComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DownloadService, useValue: mockDownloadService },
        { provide: JsonEditorService, useValue: mockJsonEditorService },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAiAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads all AI context document sources", async () => {
    const configDocument = { sentinel: "config" };
    const permissionsDocument = { sentinel: "permissions" };

    mockEntityMapper.load.mockImplementation((_entityType, key) =>
      Promise.resolve(
        key === Config.CONFIG_KEY ? configDocument : permissionsDocument,
      ),
    );

    await component.downloadAiContext();

    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      [
        configDocument,
        permissionsDocument,
        configurableEnumDocument,
        siteSettingsDocument,
        reportDocument,
        publicFormDocument,
      ],
      "json",
      expect.any(String),
    );
  });

  it("omits documents that fail to load", async () => {
    mockEntityMapper.load.mockImplementation(() =>
      Promise.reject(new Error("document not found")),
    );

    await component.downloadAiContext();

    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      [
        configurableEnumDocument,
        siteSettingsDocument,
        reportDocument,
        publicFormDocument,
      ],
      "json",
      expect.any(String),
    );
  });

  it("should call config service for configuration export", async () => {
    const exportConfigSpy = vi.spyOn(mockConfigService, "exportConfig");

    await component.downloadConfigClick();
    expect(exportConfigSpy).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });

  it("should save and apply new configuration when uploading a single config object", async () => {
    const mockFileReader = createFileReaderMock("{}");
    const saveConfigSpy = vi.spyOn(mockConfigService, "saveConfig");
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

    const entityMapper = mockEntityMapper;
    const mockEntity = new Entity("Config:CONFIG_ENTITY");
    mockEntityMapper.entityFromRawDoc.mockReturnValue(mockEntity);
    const saveAllSpy = vi.spyOn(entityMapper, "saveAll").mockResolvedValue([]);
    const saveConfigSpy = vi.spyOn(mockConfigService, "saveConfig");

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
    vi.spyOn(mockConfigService, "saveConfig").mockResolvedValue(null);

    const uploadPromise = component.uploadConfigFile({
      target: { files: [] },
    } as any);
    expect(component.isUploadingConfig()).toBe(true);
    await uploadPromise;
    expect(component.isUploadingConfig()).toBe(false);
  });

  it("should show success snackbar after uploading configuration", async () => {
    createFileReaderMock("{}");
    vi.spyOn(mockConfigService, "saveConfig").mockResolvedValue(null);
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
    vi.spyOn(mockConfigService, "saveConfig").mockRejectedValue(
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
    const entityMapper = mockEntityMapper;
    const saveSpy = vi.spyOn(entityMapper, "save").mockResolvedValue(null);
    const saveConfigSpy = vi
      .spyOn(mockConfigService, "saveConfig")
      .mockResolvedValue(null);

    component.editConfig();

    await vi.waitFor(() => expect(saveConfigSpy).toHaveBeenCalled());
    expect(saveSpy).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalledWith({ some: "updated data" });
  });

  it("should not save anything when the JSON editor is cancelled", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(of(undefined));
    const saveConfigSpy = vi.spyOn(mockConfigService, "saveConfig");

    component.editConfig();
    await Promise.resolve();

    expect(saveConfigSpy).not.toHaveBeenCalled();
  });

  it("should show an error snackbar instead of failing silently when saving the edited configuration fails", async () => {
    mockJsonEditorService.openJsonEditorDialog.mockReturnValue(
      of({ some: "updated data" }),
    );
    vi.spyOn(mockEntityMapper, "save").mockResolvedValue(null);
    vi.spyOn(mockConfigService, "saveConfig").mockRejectedValue(
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
    vi.spyOn(mockEntityMapper, "save").mockResolvedValue(null);
    vi.spyOn(mockConfigService, "saveConfig")
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
});
