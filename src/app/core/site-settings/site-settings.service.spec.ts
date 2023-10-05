import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SiteSettingsService } from "./site-settings.service";
import { FileService } from "../../features/file/file.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { SiteSettings } from "./site-settings";
import { of } from "rxjs";
import { Title } from "@angular/platform-browser";
import { availableLocales } from "../language/languages";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { FileModule } from "../../features/file/file.module";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { LoggingService } from "../logging/logging.service";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { ConfigurableEnumModule } from "../basic-datatypes/configurable-enum/configurable-enum.module";

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;
  let entityMapper: MockEntityMapperService;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(() => {
    entityMapper = mockEntityMapper();
    mockFileService = jasmine.createSpyObj(["loadFile"]);
    TestBed.configureTestingModule({
      imports: [CoreTestingModule, ConfigurableEnumModule, FileModule],
      providers: [
        { provide: FileService, useValue: mockFileService },
        { provide: EntityMapperService, useValue: entityMapper },
        EntityAbility,
      ],
    });
    service = TestBed.inject(SiteSettingsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should only publish changes if property has changed", () => {
    const titleSpy = spyOn(TestBed.inject(Title), "setTitle");
    const settings = new SiteSettings();
    titleSpy.calls.reset();

    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.displayLanguageSelect = false;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.siteName = "New name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();

    titleSpy.calls.reset();
    settings.displayLanguageSelect = true;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.displayLanguageSelect = false;
    settings.siteName = "Another new name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();
  });

  it("should reset favicon when deleted", fakeAsync(() => {
    const siteSettings = SiteSettings.create({ favicon: "some.icon" });
    mockFileService.loadFile.and.returnValue(of({ url: "icon.url" }));
    const mockIconEl = { href: "initial" };
    spyOn(document, "querySelector").and.returnValue(mockIconEl as any);
    entityMapper.add(siteSettings);
    tick();

    expect(mockFileService.loadFile).toHaveBeenCalledWith(
      siteSettings,
      "favicon",
    );
    expect(mockIconEl.href).toBe("icon.url");

    mockFileService.loadFile.calls.reset();
    delete siteSettings.favicon;
    entityMapper.add(siteSettings);
    tick();

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(mockIconEl.href).toBe("favicon.ico");
  }));

  function expectStyleSetProperty(siteSettingsProperty, cssVariable, value) {
    spyOn(document.documentElement.style, "setProperty");

    entityMapper.add(SiteSettings.create({ [siteSettingsProperty]: value }));

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      cssVariable,
      value,
    );
  }

  it("should set font family once defined", () => {
    expectStyleSetProperty("font", "--font-family", "comic sans");
  });

  it("should update the color palette if a color is changed", () => {
    expectStyleSetProperty("primary", "--primary-50", "#ffffff");
  });

  it("should store any settings update in localStorage", fakeAsync(() => {
    const localStorageSetItemSpy = spyOn(localStorage, "setItem");

    const settings = SiteSettings.create({
      siteName: "test",
      defaultLanguage: availableLocales.values[0],
    });

    entityMapper.save(settings);
    tick();

    expect(localStorageSetItemSpy).toHaveBeenCalledWith(
      service.SITE_SETTINGS_LOCAL_STORAGE_KEY,
      jasmine.any(String),
    );
    expect(localStorageSetItemSpy.calls.mostRecent().args[1]).toMatch(
      `"siteName":"${settings.siteName}"`,
    );
    expect(localStorageSetItemSpy.calls.mostRecent().args[1]).toMatch(
      `"defaultLanguage":"${settings.defaultLanguage.id}"`,
    );
  }));

  it("should init settings from localStorage during startup", fakeAsync(() => {
    const settings = SiteSettings.create({ siteName: "local storage test" });
    const localStorageGetItemSpy = spyOn(localStorage, "getItem");
    localStorageGetItemSpy.and.returnValue(JSON.stringify(settings));

    const titleSpy = spyOn(TestBed.inject(Title), "setTitle");

    service = new SiteSettingsService(
      TestBed.inject(Title),
      TestBed.inject(FileService),
      TestBed.inject(EntitySchemaService),
      TestBed.inject(ConfigurableEnumService),
      TestBed.inject(EntityMapperService),
      TestBed.inject(LoggingService),
    );

    expect(titleSpy).toHaveBeenCalledWith(settings.siteName);
  }));
});
