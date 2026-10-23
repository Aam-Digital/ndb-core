import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";

import { LanguageService } from "./language.service";
import { LOCALE_ID } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import {
  LANGUAGE_LOCAL_STORAGE_KEY,
  LANGUAGE_OWNER_LOCAL_STORAGE_KEY,
} from "./language-statics";
import { ReplaySubject, Subject } from "rxjs";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { SiteSettings } from "#src/app/core/site-settings/site-settings";
import { UserSettingsService } from "../site-settings/user-settings.service";
import { UserSettings } from "../site-settings/user-settings";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";

describe("LanguageService", () => {
  let service: LanguageService;
  let reloadSpy: Mock;
  let languageSubject: ReplaySubject<ConfigurableEnumValue>;
  let mockEntityMapperUpdates: Subject<UpdatedEntity<SiteSettings>>;
  let userSettingsUpdates: Subject<UpdatedEntity<UserSettings>>;
  let mockUserSettings: { getLanguage: Mock };
  let sessionInfo: SessionSubject;
  let ownLanguage: string | undefined;
  let siteSettingsMock: {
    defaultLanguage: ReplaySubject<ConfigurableEnumValue>;
    languageSwitchingEnabled: boolean;
  };

  beforeEach(() => {
    reloadSpy = vi.fn();
    const mockWindow: Partial<Window> = {
      localStorage: window.localStorage,
      location: { reload: reloadSpy } as any,
    };
    languageSubject = new ReplaySubject(1);
    mockEntityMapperUpdates = new Subject();
    userSettingsUpdates = new Subject();
    // starts empty, exactly as at bootstrap before any login
    sessionInfo = new SessionSubject();
    // by default the user has not chosen a language for their own account
    ownLanguage = undefined;
    // mirrors the real service: it reads the logged-in user, so without a
    // session there is no account to look settings up for
    siteSettingsMock = {
      defaultLanguage: languageSubject,
      languageSwitchingEnabled: true,
    };
    mockUserSettings = {
      getLanguage: vi
        .fn()
        .mockImplementation(async () =>
          sessionInfo.value?.id ? ownLanguage : undefined,
        ),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: "en-US" },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        {
          provide: SiteSettingsService,
          useValue: siteSettingsMock,
        },
        {
          provide: EntityMapperService,
          useValue: {
            receiveUpdates: (type) =>
              type === UserSettings
                ? userSettingsUpdates
                : mockEntityMapperUpdates,
          },
        },
        { provide: UserSettingsService, useValue: mockUserSettings },
        { provide: SessionSubject, useValue: sessionInfo },
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY);
  });

  function logIn() {
    sessionInfo.next({
      name: "demo",
      id: "demo",
      roles: [],
      entityId: "User:demo",
    } as SessionInfo);
  }

  it("should return the current locale", () => {
    expect(service.getCurrentLocale()).toBe("en-US");
  });

  it("should use the default locale if no locale is set", async () => {
    service.initDefaultLanguage();
    languageSubject.next({ id: "de", label: "de" });
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not change language if a different locale is set", async () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");
    service.initDefaultLanguage();
    languageSubject.next({ id: "de", label: "de" });
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("should not reload, if the current locale is the same as the default", () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "de");
    service.switchLocale("de");
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("should switch locale and reload the page", () => {
    service.switchLocale("de");
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should apply the user's own language when they log in after init", async () => {
    // the session is only established after bootstrap, so this is the only
    // point at which the language stored for the account can be read
    ownLanguage = "fr";

    service.initDefaultLanguage();
    languageSubject.next({ id: "de", label: "de" });

    logIn();
    await new Promise((resolve) => setTimeout(resolve));

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
  });

  it.each([
    ["picked on this device", "de", null],
    ["applied from this user's settings before", "de", "demo"],
    ["applied from another account's settings", "en-US", "other-user"],
  ])(
    "for a user without their own language, a locale %s should lead to %s",
    async (_, expected, owner) => {
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "de");
      if (owner) {
        window.localStorage.setItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY, owner);
      }
      languageSubject.next({ id: "en-US", label: "en" });

      logIn();
      await new Promise((resolve) => setTimeout(resolve));

      expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(
        expected,
      );
    },
  );

  it("should reset another account's locale to the app default when the site has no default language", async () => {
    vi.useFakeTimers();
    try {
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "de");
      window.localStorage.setItem(
        LANGUAGE_OWNER_LOCAL_STORAGE_KEY,
        "other-user",
      );

      logIn();
      await vi.advanceTimersByTimeAsync(LanguageService.SITE_DEFAULT_WAIT_MS);

      expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(
        "en-US",
      );
      expect(
        window.localStorage.getItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY),
      ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should apply the user's own language once their settings arrive later through sync", async () => {
    logIn();
    await new Promise((resolve) => setTimeout(resolve));
    expect(reloadSpy).not.toHaveBeenCalled();

    userSettingsUpdates.next({
      entity: Object.assign(new UserSettings("other-user"), {
        defaultLanguage: { id: "de", label: "de" },
      }),
      type: "new",
    });
    expect(reloadSpy).not.toHaveBeenCalled();

    userSettingsUpdates.next({
      entity: Object.assign(new UserSettings("demo"), {
        defaultLanguage: { id: "fr", label: "fr" },
      }),
      type: "new",
    });

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
    expect(window.localStorage.getItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY)).toBe(
      "demo",
    );
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not override a user's own language when the system default changes", async () => {
    mockUserSettings.getLanguage.mockResolvedValue("fr");
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");

    mockEntityMapperUpdates.next({
      entity: Object.assign(new SiteSettings(), {
        defaultLanguage: { id: "de", label: "de" },
      }),
      type: "update",
    });
    await new Promise((resolve) => setTimeout(resolve));

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("should apply a changed system default to users without their own language", async () => {
    mockEntityMapperUpdates.next({
      entity: Object.assign(new SiteSettings(), {
        defaultLanguage: { id: "de", label: "de" },
      }),
      type: "update",
    });
    await new Promise((resolve) => setTimeout(resolve));

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not store a locale that is not a string", () => {
    service.initDefaultLanguage();
    languageSubject.next({ id: { id: "de", label: "de" } as any, label: "de" });

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(null);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  describe("with language switching disabled", () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve));

    beforeEach(() => {
      siteSettingsMock.languageSwitchingEnabled = false;
      languageSubject.next({ id: "de", label: "de" });
    });

    it("should ignore a language stored on the device and apply the system language at startup", () => {
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");

      service.initDefaultLanguage();
      return tick().then(() => {
        expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(
          "de",
        );
        expect(reloadSpy).toHaveBeenCalled();
      });
    });

    it("should ignore the user's own language on login", async () => {
      ownLanguage = "fr";
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");
      window.localStorage.setItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY, "demo");

      logIn();
      await tick();

      expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(
        "de",
      );
      expect(
        window.localStorage.getItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY),
      ).toBeNull();
    });

    it("should ignore updates of the user's own language", async () => {
      logIn();
      await tick();
      reloadSpy.mockClear();

      userSettingsUpdates.next({
        entity: Object.assign(new UserSettings("demo"), {
          defaultLanguage: { id: "fr", label: "fr" },
        }),
        type: "update",
      });

      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it("should apply a changed system language even if the user has their own", async () => {
      mockUserSettings.getLanguage.mockResolvedValue("fr");
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");

      mockEntityMapperUpdates.next({
        entity: Object.assign(new SiteSettings(), {
          defaultLanguage: { id: "es", label: "es" },
        }),
        type: "update",
      });
      await tick();

      expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(
        "es",
      );
    });

    it("should not reload if the system language is already active", async () => {
      languageSubject.next({ id: "en-US", label: "en" });

      logIn();
      await tick();

      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});
