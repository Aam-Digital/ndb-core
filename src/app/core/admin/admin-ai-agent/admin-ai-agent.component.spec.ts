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

describe("AdminAiAgentComponent", () => {
  let component: AdminAiAgentComponent;
  let fixture: ComponentFixture<AdminAiAgentComponent>;
  let mockEntityMapper: {
    loadType: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
  };
  let mockDownloadService: { triggerDownload: ReturnType<typeof vi.fn> };

  const configurableEnumDocument = { sentinel: "configurable-enum" };
  const siteSettingsDocument = { sentinel: "site-settings" };
  const reportDocument = { sentinel: "report" };
  const publicFormDocument = { sentinel: "public-form" };

  beforeEach(async () => {
    mockEntityMapper = {
      loadType: vi.fn().mockName("EntityMapperService.loadType"),
      load: vi.fn().mockName("EntityMapperService.load"),
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
      return Promise.resolve([]);
    });
    mockEntityMapper.load.mockImplementation((entityType, key) => {
      if (entityType === SiteSettings && key === SiteSettings.ENTITY_ID) {
        return Promise.resolve(siteSettingsDocument);
      }
      return Promise.resolve(null);
    });

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
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAiAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("downloads all AI context document sources", async () => {
    const configDocument = { sentinel: "config" };
    const permissionsDocument = { sentinel: "permissions" };

    mockEntityMapper.load.mockImplementation((entityType, key) => {
      if (entityType === SiteSettings) {
        return Promise.resolve(siteSettingsDocument);
      }
      return Promise.resolve(
        key === Config.CONFIG_KEY ? configDocument : permissionsDocument,
      );
    });

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
      [configurableEnumDocument, reportDocument, publicFormDocument],
      "json",
      expect.any(String),
    );
  });

  it("includes only the global site settings, not every user's own settings", async () => {
    // loading the whole type would add one doc per user account
    await component.downloadAiContext();

    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      SiteSettings,
      SiteSettings.ENTITY_ID,
    );
    expect(mockEntityMapper.loadType).not.toHaveBeenCalledWith(SiteSettings);
  });
});
