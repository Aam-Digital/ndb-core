import { TestBed } from "@angular/core/testing";

import { LanguageService } from "./language.service";
import { LOCALE_ID } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { Subject } from "rxjs";
import { SiteSettingsService } from "../site-settings/site-settings.service";

describe("TranslationServiceService", () => {
  let service: LanguageService;
  let reloadSpy: jasmine.Spy;
  let languageSubject: Subject<string>;

  beforeEach(() => {
    reloadSpy = jasmine.createSpy();
    const mockWindow: Partial<Window> = {
      localStorage: window.localStorage,
      location: { reload: reloadSpy } as any,
    };
    languageSubject = new Subject<string>();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: "en-US" },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        {
          provide: SiteSettingsService,
          useValue: { language: languageSubject },
        },
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

  it("should return the current region code", () => {
    expect(service.currentRegionCode()).toBe("us");
  });

  it("should set use the default locale if no locale is set", () => {
    service.initDefaultLanguage();
    languageSubject.next("de");
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not change language if a different locale is set", () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");
    service.initDefaultLanguage();
    languageSubject.next("de");
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("should not reload, if the current locale is the same as the default", () => {
    service.initDefaultLanguage();
    languageSubject.next("en-US");
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
