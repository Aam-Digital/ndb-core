import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { TranslationModule } from "../translation.module";
import { RouterTestingModule } from "@angular/router/testing";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-key";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";

describe("LanguageSelectComponent", () => {
  let component: LanguageSelectComponent;
  let fixture: ComponentFixture<LanguageSelectComponent>;
  let mockLocation: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    mockLocation = jasmine.createSpyObj("Location", ["reload"]);
    await TestBed.configureTestingModule({
      declarations: [LanguageSelectComponent],
      providers: [{ provide: LOCATION_TOKEN, useValue: mockLocation }],
      imports: [TranslationModule, RouterTestingModule],
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
