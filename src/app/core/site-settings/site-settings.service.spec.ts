import { TestBed, waitForAsync } from "@angular/core/testing";

import { SiteSettingsService } from "./site-settings.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { SiteSettings } from "./site-settings";
import { Title } from "@angular/platform-browser";
import { availableLocales } from "../language/languages";
import { ConfigurableEnumModule } from "../basic-datatypes/configurable-enum/configurable-enum.module";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { Config } from "../config/config";
import { EntityConfigReadyService } from "../entity/entity-config-ready.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../session/session-type";
import { LOCAL_STORAGE_TOKEN } from "../../utils/di-tokens";
import { createFakeStorage } from "../../utils/test-utils/fake-storage";

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;
  let entityMapper: MockEntityMapperService;

  let storage: Storage;

  beforeEach(waitForAsync(() => {
    storage = createFakeStorage();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule, ConfigurableEnumModule],
      providers: [
        { provide: LOCAL_STORAGE_TOKEN, useValue: storage },
        ...mockEntityMapperProvider([new Config(Config.CONFIG_KEY, {})]),
        EntityAbility,
      ],
    });
    service = TestBed.inject(SiteSettingsService);
    TestBed.inject(EntityConfigReadyService).markSetupCompleted();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  }));

  afterEach(() => {
    localStorage.removeItem(service.SITE_SETTINGS_LOCAL_STORAGE_KEY);
  });

  it("should only publish changes if property has changed", () => {
    const titleSpy = vi.spyOn(TestBed.inject(Title), "setTitle");
    const settings = new SiteSettings();
    settings.siteName = undefined;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.hideSiteNameInToolbar = true;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.siteName = "New name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();

    titleSpy.mockClear();
    settings.hideSiteNameInToolbar = false;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.hideSiteNameInToolbar = true;
    settings.siteName = "Another new name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();
  });

  const DE = { id: "de", label: "German" };
  const FR = { id: "fr", label: "French" };
  const EN = { id: "en-US", label: "English" };

  it.each([
    ["no list: only the default language", [], DE, [DE]],
    [
      "no list and no default language: all languages",
      [],
      undefined,
      availableLocales.values,
    ],
    ["list with the default language", [DE, FR], DE, [DE, FR]],
    ["list without the default language", [FR], DE, [FR, DE]],
    ["list and no default language set", [FR, EN], undefined, [FR, EN]],
  ])(
    "should enable locales for %s",
    (_, enabled, defaultLanguage, expected) => {
      entityMapper.add(
        SiteSettings.create({
          availableLocales: enabled,
          defaultLanguage: defaultLanguage,
        }),
      );

      expect(service.enabledLocales()).toEqual(expected);
    },
  );

  describe("translationsEnabled", () => {
    const originalFlag = environment.multiLingualConfigEnabled;

    afterEach(() => {
      environment.multiLingualConfigEnabled = originalFlag;
    });

    it.each([
      ["the flag is off", false, [DE, FR], false],
      [
        "the flag is on but only the default language is enabled",
        true,
        [],
        false,
      ],
      ["the flag is on and several languages are enabled", true, [FR], true],
    ])("is %s", (_, flag, enabled, expected) => {
      environment.multiLingualConfigEnabled = flag;
      entityMapper.add(
        SiteSettings.create({ availableLocales: enabled, defaultLanguage: DE }),
      );

      expect(service.translationsEnabled()).toBe(expected);
    });
  });

  function expectStyleSetProperty(siteSettingsProperty, cssVariable, value) {
    vi.spyOn(document.documentElement.style, "setProperty");

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

  it("should store any settings update in localStorage", async () => {
    vi.useFakeTimers();
    try {
      const settings = SiteSettings.create({
        siteName: "test",
        defaultLanguage: availableLocales.values[0],
      });

      entityMapper.save(settings);
      await vi.advanceTimersByTimeAsync(0);

      const stored = storage.getItem(service.SITE_SETTINGS_LOCAL_STORAGE_KEY);
      expect(stored).toEqual(expect.any(String));
      expect(stored).toMatch(`"siteName":"${settings.siteName}"`);
      expect(stored).toMatch(
        `"defaultLanguage":"${settings.defaultLanguage.id}"`,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should init settings from localStorage during startup", async () => {
    vi.useFakeTimers();
    try {
      const settings = SiteSettings.create({ siteName: "local storage test" });
      storage.setItem(
        service.SITE_SETTINGS_LOCAL_STORAGE_KEY,
        JSON.stringify(settings),
      );

      const titleSpy = vi.spyOn(TestBed.inject(Title), "setTitle");

      TestBed.runInInjectionContext(() => new SiteSettingsService());
      await vi.advanceTimersByTimeAsync(0);

      expect(titleSpy).toHaveBeenCalledWith(settings.siteName);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should load site settings via anonymous fetch before entity config setup completes", async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    const originalSessionType = environment.session_type;
    const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(
      window.navigator,
      "onLine",
    );

    environment.session_type = SessionType.synced;
    const anonymousSettings = {
      _id: "SiteSettings:global",
      siteName: "anonymous branding",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(anonymousSettings), { status: 200 }),
      );

    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      imports: [CoreTestingModule, ConfigurableEnumModule],
      providers: [
        ...mockEntityMapperProvider([new Config(Config.CONFIG_KEY, {})]),
        EntityAbility,
      ],
    });

    try {
      const titleSpy = vi.spyOn(TestBed.inject(Title), "setTitle");

      TestBed.inject(SiteSettingsService);
      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "/db/app/SiteSettings%3Aglobal",
        expect.objectContaining({
          headers: { "ngsw-bypass": "true" },
        }),
      );
      await vi.waitFor(() => {
        expect(titleSpy).toHaveBeenCalledWith(anonymousSettings.siteName);
      });
    } finally {
      fetchSpy.mockRestore();
      if (originalOnlineDescriptor) {
        Object.defineProperty(
          window.navigator,
          "onLine",
          originalOnlineDescriptor,
        );
      } else {
        // `onLine` is normally inherited from Navigator.prototype: remove the own property again,
        // otherwise it shadows the prototype getter that later specs in this worker stub
        Reflect.deleteProperty(window.navigator, "onLine");
      }
      environment.session_type = originalSessionType;
    }
  });
  it("saves a new default language without losing other settings", async () => {
    entityMapper.add(SiteSettings.create({ siteName: "My site" }));

    await service.setDefaultLanguage({ id: "de", label: "Deutsch" });

    const saved = await entityMapper.load(SiteSettings, SiteSettings.ENTITY_ID);
    expect(saved.defaultLanguage.id).toBe("de");
    expect(saved.siteName).toBe("My site");
  });

  it("creates the site settings to save the default language on a fresh system", async () => {
    await service.setDefaultLanguage({ id: "de", label: "Deutsch" });

    const saved = await entityMapper.load(SiteSettings, SiteSettings.ENTITY_ID);
    expect(saved.defaultLanguage.id).toBe("de");
  });
});
