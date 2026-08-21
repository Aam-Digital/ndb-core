import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject } from "rxjs";

import { UserLanguageSettingsComponent } from "./user-language-settings.component";
import { LanguageService } from "../../language/language.service";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { UserSettingsService } from "../../site-settings/user-settings.service";
import { Logging } from "../../logging/logging.service";

describe("UserLanguageSettingsComponent", () => {
  let component: UserLanguageSettingsComponent;
  let fixture: ComponentFixture<UserLanguageSettingsComponent>;
  let userSettings: { setLanguage: ReturnType<typeof vi.fn> };
  let languageService: { switchLocale: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let displayLanguageSelect: BehaviorSubject<boolean>;

  async function createComponent() {
    userSettings = { setLanguage: vi.fn().mockResolvedValue(undefined) };
    languageService = {
      switchLocale: vi.fn(),
      getCurrentLocale: vi.fn().mockReturnValue("en-US"),
    } as any;
    snackBar = { open: vi.fn() };
    displayLanguageSelect = new BehaviorSubject(true);

    await TestBed.configureTestingModule({
      imports: [UserLanguageSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: UserSettingsService, useValue: userSettings },
        { provide: LanguageService, useValue: languageService },
        { provide: MatSnackBar, useValue: snackBar },
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
    expect(snackBar.open).toHaveBeenCalled();
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
