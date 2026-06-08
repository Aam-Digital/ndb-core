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

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;
  let entityMapper: MockEntityMapperService;

  beforeEach(waitForAsync(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule, ConfigurableEnumModule],
      providers: [
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

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should only publish changes if property has changed", () => {
    const titleSpy = vi.spyOn(TestBed.inject(Title), "setTitle");
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

    titleSpy.mockClear();
    settings.displayLanguageSelect = true;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.displayLanguageSelect = false;
    settings.siteName = "Another new name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();
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
      const localStorageSetItemSpy = vi.spyOn(Storage.prototype, "setItem");

      const settings = SiteSettings.create({
        siteName: "test",
        defaultLanguage: availableLocales.values[0],
      });

      entityMapper.save(settings);
      await vi.advanceTimersByTimeAsync(0);

      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        service.SITE_SETTINGS_LOCAL_STORAGE_KEY,
        expect.any(String),
      );
      expect(vi.mocked(localStorageSetItemSpy).mock.lastCall[1]).toMatch(
        `"siteName":"${settings.siteName}"`,
      );
      expect(vi.mocked(localStorageSetItemSpy).mock.lastCall[1]).toMatch(
        `"defaultLanguage":"${settings.defaultLanguage.id}"`,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should init settings from localStorage during startup", async () => {
    vi.useFakeTimers();
    let localStorageGetItemSpy: ReturnType<typeof vi.spyOn>;
    try {
      const settings = SiteSettings.create({ siteName: "local storage test" });
      localStorageGetItemSpy = vi.spyOn(Storage.prototype, "getItem");
      localStorageGetItemSpy.mockReturnValue(JSON.stringify(settings));

      const titleSpy = vi.spyOn(TestBed.inject(Title), "setTitle");

      TestBed.runInInjectionContext(() => new SiteSettingsService());
      await vi.advanceTimersByTimeAsync(0);

      expect(titleSpy).toHaveBeenCalledWith(settings.siteName);
    } finally {
      localStorageGetItemSpy?.mockRestore();
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
      }
      environment.session_type = originalSessionType;
    }
  });
});
