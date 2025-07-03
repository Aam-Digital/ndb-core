import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { SiteSettingsService } from "./site-settings.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { SiteSettings } from "./site-settings";
import { Title } from "@angular/platform-browser";
import { availableLocales } from "../language/languages";
import { ConfigurableEnumModule } from "../basic-datatypes/configurable-enum/configurable-enum.module";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { CoreTestingModule } from "../../utils/core-testing.module";

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;
  let entityMapper: MockEntityMapperService;

  beforeEach(waitForAsync(() => {
    localStorage.clear();
    entityMapper = mockEntityMapper();
    TestBed.configureTestingModule({
      imports: [CoreTestingModule, ConfigurableEnumModule],
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        EntityAbility,
      ],
    });
    service = TestBed.inject(SiteSettingsService);
  }));

  afterEach(() => {
    localStorage.removeItem(service.SITE_SETTINGS_LOCAL_STORAGE_KEY);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should only publish changes if property has changed", () => {
    const titleSpy = spyOn(TestBed.inject(Title), "setTitle");
    const settings = new SiteSettings();
    settings.siteName = undefined;
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
      TestBed.inject(EntitySchemaService),
      TestBed.inject(ConfigurableEnumService),
      TestBed.inject(EntityMapperService),
    );

    expect(titleSpy).toHaveBeenCalledWith(settings.siteName);
  }));
});
