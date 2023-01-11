import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-statics";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LanguageService } from "../language.service";

describe("LanguageSelectComponent", () => {
  let component: LanguageSelectComponent;
  let fixture: ComponentFixture<LanguageSelectComponent>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockTranslationService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockLocation = jasmine.createSpyObj("Location", ["reload"]);
    mockTranslationService = jasmine.createSpyObj("LanguageService", [
      "currentRegionCode",
      "initDefaultLanguage",
    ]);
    await TestBed.configureTestingModule({
      imports: [LanguageSelectComponent, RouterTestingModule],
      providers: [
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: LanguageService, useValue: mockTranslationService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should write selected language to local storage and reload page", () => {
    component.changeLocale("de");
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe("de");
    expect(mockLocation.reload).toHaveBeenCalled();
  });
});
