import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";

import { LanguageService } from "./language.service";
import { LOCALE_ID } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { Subject } from "rxjs";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { SiteSettings } from "#src/app/core/site-settings/site-settings";
import { UserSettingsService } from "../site-settings/user-settings.service";

describe("LanguageService", () => {
  let service: LanguageService;
  let reloadSpy: Mock;
  let languageSubject: Subject<ConfigurableEnumValue>;
  let mockEntityMapperUpdates: Subject<UpdatedEntity<SiteSettings>>;
  let mockUserSettings: { getLanguage: Mock };

  beforeEach(() => {
    reloadSpy = vi.fn();
    const mockWindow: Partial<Window> = {
      localStorage: window.localStorage,
      location: { reload: reloadSpy } as any,
    };
    languageSubject = new Subject();
    mockEntityMapperUpdates = new Subject();
    // by default the user has not chosen a language for their own account
    mockUserSettings = { getLanguage: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: "en-US" },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        {
          provide: SiteSettingsService,
          useValue: { defaultLanguage: languageSubject },
        },
        {
          provide: EntityMapperService,
          useValue: { receiveUpdates: () => mockEntityMapperUpdates },
        },
        { provide: UserSettingsService, useValue: mockUserSettings },
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return the current locale", () => {
    expect(service.getCurrentLocale()).toBe("en-US");
  });

  it("should use the default locale if no locale is set", async () => {
    await service.initDefaultLanguage();
    languageSubject.next({ id: "de", label: "de" });
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not change language if a different locale is set", async () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");
    await service.initDefaultLanguage();
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

  it("should prefer the language the user chose for their own account", async () => {
    mockUserSettings.getLanguage.mockResolvedValue("fr");

    await service.initDefaultLanguage();

    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
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
});
