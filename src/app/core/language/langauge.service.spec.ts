import { TestBed } from "@angular/core/testing";

import { LanguageService } from "./language.service";
import { LOCALE_ID } from "@angular/core";
import { ConfigService } from "../config/config.service";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { of } from "rxjs";

describe("TranslationServiceService", () => {
  let service: LanguageService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let reloadSpy: jasmine.Spy;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj("ConfigService", ["getConfig"], {
      configUpdates: of({}),
    });
    reloadSpy = jasmine.createSpy();
    const mockWindow: Partial<Window> = {
      localStorage: window.localStorage,
      location: { reload: reloadSpy } as any,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: "en-US" },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
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
    mockConfigService.getConfig.and.returnValue({ default_language: "de" });
    service.initDefaultLanguage();
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("should not change language if a different locale is set", () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "fr");
    mockConfigService.getConfig.and.returnValue({ default_language: "de" });
    service.initDefaultLanguage();
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("fr");
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("should not reload, if the current locale is the same as the default", () => {
    mockConfigService.getConfig.and.returnValue({ default_language: "en-US" });
    service.initDefaultLanguage();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
