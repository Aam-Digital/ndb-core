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
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { SessionSubject } from "../../session/auth/session-info";
import { EntityPermissionError } from "../../entity/entity-mapper/entity-permission-error";

describe("UserLanguageSettingsComponent", () => {
  let component: UserLanguageSettingsComponent;
  let fixture: ComponentFixture<UserLanguageSettingsComponent>;
  let userSettings: { setLanguage: ReturnType<typeof vi.fn> };
  let languageService: { switchToOwnLocale: ReturnType<typeof vi.fn> };
  let alertService: { addDanger: ReturnType<typeof vi.fn> };
  let displayLanguageSelect: BehaviorSubject<boolean>;
  let ability: EntityAbility;

  async function createComponent() {
    userSettings = { setLanguage: vi.fn().mockResolvedValue(undefined) };
    languageService = {
      switchToOwnLocale: vi.fn(),
      getCurrentLocale: vi.fn().mockReturnValue("en-US"),
    } as any;
    alertService = { addDanger: vi.fn() };
    displayLanguageSelect = new BehaviorSubject(true);

    await TestBed.configureTestingModule({
      imports: [
        UserLanguageSettingsComponent,
        NoopAnimationsModule,
        CoreTestingModule,
      ],
      providers: [
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject({ id: "user-1", name: "user-1" }),
        },
        { provide: UserSettingsService, useValue: userSettings },
        { provide: LanguageService, useValue: languageService },
        { provide: AlertService, useValue: alertService },
        {
          provide: SiteSettingsService,
          useValue: { displayLanguageSelect },
        },
      ],
    }).compileComponents();

    ability = TestBed.inject(EntityAbility);
    ability.update([{ subject: "all", action: "manage" }]);

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
    expect(languageService.switchToOwnLocale).toHaveBeenCalledWith("de");
  });

  it("should not apply the language if saving it failed", async () => {
    const errorLog = vi.spyOn(Logging, "error").mockImplementation(() => {});
    userSettings.setLanguage.mockRejectedValue(new Error("offline"));

    await component.onLanguageSelected("de");

    expect(languageService.switchToOwnLocale).not.toHaveBeenCalled();
    expect(alertService.addDanger).toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalled();
  });

  it.each([
    [
      "the local permission check",
      new EntityPermissionError("create", "user-1", "UserSettings"),
    ],
    ["the server", { status: 403, error: "forbidden" }],
  ])(
    "should not report a save rejected by %s, since the permission config causes it",
    async (_source, rejection) => {
      const errorLog = vi.spyOn(Logging, "error").mockImplementation(() => {});
      const warnLog = vi.spyOn(Logging, "warn").mockImplementation(() => {});
      userSettings.setLanguage.mockRejectedValue(rejection);

      await component.onLanguageSelected("de");

      expect(errorLog).not.toHaveBeenCalled();
      expect(warnLog).not.toHaveBeenCalled();
      // retrying cannot help, so the user is pointed to their administrator
      expect(alertService.addDanger).toHaveBeenCalledWith(
        component.missingPermissionText,
      );
      expect(languageService.switchToOwnLocale).not.toHaveBeenCalled();
    },
  );

  it("should disable the select and explain why while the user may not save their own settings", () => {
    ability.update([{ subject: "Child", action: "manage" }]);
    fixture.detectChanges();

    expect(languageSelect().disabled()).toBe(true);
    expect(languageSelect().hint()).toBe(component.missingPermissionText);

    // the rules can change at runtime, e.g. when an admin grants the permission
    ability.update([{ subject: "UserSettings", action: "manage" }]);
    fixture.detectChanges();

    expect(languageSelect().disabled()).toBe(false);
    expect(languageSelect().hint()).toBe(component.languageHint);
  });

  it("should check the permission against the user's own settings document", () => {
    ability.update([
      {
        subject: "UserSettings",
        action: "manage",
        conditions: { userId: "someone-else" },
      },
    ]);
    fixture.detectChanges();
    expect(languageSelect().disabled()).toBe(true);

    ability.update([
      {
        subject: "UserSettings",
        action: "manage",
        conditions: { userId: "user-1" },
      },
    ]);
    fixture.detectChanges();
    expect(languageSelect().disabled()).toBe(false);
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
    expect(languageService.switchToOwnLocale).not.toHaveBeenCalled();
  });

  it("should show the selector only when the admin enabled it", async () => {
    expect(component.displayLanguageSelect()).toBe(true);

    displayLanguageSelect.next(false);
    fixture.detectChanges();

    expect(component.displayLanguageSelect()).toBe(false);
  });
});
