import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AlertService } from "../../alerts/alert.service";
import { BehaviorSubject } from "rxjs";

import { By } from "@angular/platform-browser";

import { UserLanguageSettingsComponent } from "./user-language-settings.component";
import { LanguageSelectComponent } from "../../language/language-select/language-select.component";
import { LanguageService } from "../../language/language.service";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { UserSettingsService } from "../../site-settings/user-settings.service";
import { Logging } from "../../logging/logging.service";

describe("UserLanguageSettingsComponent", () => {
  let component: UserLanguageSettingsComponent;
  let fixture: ComponentFixture<UserLanguageSettingsComponent>;
  let userSettings: { setLanguage: ReturnType<typeof vi.fn> };
  let languageService: { switchLocale: ReturnType<typeof vi.fn> };
  let alertService: { addDanger: ReturnType<typeof vi.fn> };
  let displayLanguageSelect: BehaviorSubject<boolean>;

  async function createComponent() {
    userSettings = { setLanguage: vi.fn().mockResolvedValue(undefined) };
    languageService = {
      switchLocale: vi.fn(),
      getCurrentLocale: vi.fn().mockReturnValue("en-US"),
    } as any;
    alertService = { addDanger: vi.fn() };
    displayLanguageSelect = new BehaviorSubject(true);

    await TestBed.configureTestingModule({
      imports: [UserLanguageSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: UserSettingsService, useValue: userSettings },
        { provide: LanguageService, useValue: languageService },
        { provide: AlertService, useValue: alertService },
        {
          provide: SiteSettingsService,
          useValue: { displayLanguageSelect },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserLanguageSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => createComponent());

  afterEach(() => TestBed.resetTestingModule());

  function languageSelect(): LanguageSelectComponent {
    return fixture.debugElement.query(By.directive(LanguageSelectComponent))
      .componentInstance;
  }

  it("should save the language before applying it, since applying reloads the app", async () => {
    await component.onLanguageSelected("de");

    expect(userSettings.setLanguage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "de" }),
    );
    expect(languageService.switchLocale).toHaveBeenCalledWith("de");
  });

  it("should not apply the language if saving it failed", async () => {
    vi.spyOn(Logging, "error").mockImplementation(() => {});
    userSettings.setLanguage.mockRejectedValue(new Error("offline"));

    await component.onLanguageSelected("de");

    expect(languageService.switchLocale).not.toHaveBeenCalled();
    expect(alertService.addDanger).toHaveBeenCalled();
  });

  it("should revert the shown selection if saving failed", async () => {
    vi.spyOn(Logging, "error").mockImplementation(() => {});
    userSettings.setLanguage.mockRejectedValue(new Error("offline"));
    const select = fixture.debugElement.children[0].componentInstance;
    // the dropdown shows the picked language right away
    select.changeLocale("de");
    expect(select.currentLocale()).toBe("de");

    await component.onLanguageSelected("de");
    expect(select.currentLocale()).toBe("en-US");
  });

  it("should disable the select while a save is in flight", async () => {
    // the dropdown moves to the new value as soon as it is picked, so a second
    // pick has to be prevented rather than silently dropped
    let resolveSave: () => void;
    userSettings.setLanguage.mockReturnValue(
      new Promise<void>((resolve) => (resolveSave = resolve)),
    );

    const pending = component.onLanguageSelected("de");
    fixture.detectChanges();
    expect(languageSelect().disabled()).toBe(true);

    resolveSave();
    await pending;
    fixture.detectChanges();

    expect(languageSelect().disabled()).toBe(false);
  });

  it("should ignore a locale that is not available", async () => {
    await component.onLanguageSelected("not-a-locale");

    expect(userSettings.setLanguage).not.toHaveBeenCalled();
    expect(languageService.switchLocale).not.toHaveBeenCalled();
  });

  it("should show the selector only when the admin enabled it", async () => {
    expect(component.displayLanguageSelect()).toBe(true);

    displayLanguageSelect.next(false);
    fixture.detectChanges();

    expect(component.displayLanguageSelect()).toBe(false);
  });
});
