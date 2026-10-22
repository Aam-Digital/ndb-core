import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { AlertService } from "../../alerts/alert.service";
import { LanguageSelectComponent } from "../../language/language-select/language-select.component";
import { LanguageService } from "../../language/language.service";
import { availableLocales } from "../../language/languages";
import { Logging } from "../../logging/logging.service";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { UserSettingsService } from "../../site-settings/user-settings.service";
import { UserSettings } from "../../site-settings/user-settings";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityPermissionError } from "../../entity/entity-mapper/entity-permission-error";
import { SessionSubject } from "../../session/auth/session-info";
import { isNotPermittedError } from "#src/app/utils/not-permitted-error";

/**
 * Lets a user pick the language for their own account.
 * Users who never pick one keep following the system-wide default.
 */
@Component({
  selector: "app-user-language-settings",
  templateUrl: "./user-language-settings.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSelectComponent],
})
export class UserLanguageSettingsComponent {
  private readonly userSettings = inject(UserSettingsService);
  private readonly languageService = inject(LanguageService);
  private readonly siteSettings = inject(SiteSettingsService);
  private readonly alertService = inject(AlertService);
  private readonly ability = inject(EntityAbility);
  private readonly session = toSignal(inject(SessionSubject));

  readonly availableLocales = availableLocales.values;

  readonly languageHint = $localize`:User Profile - language setting hint:Only applies to your account. The app reloads when you change it.`;

  /** admins can hide the language selector for their system */
  readonly displayLanguageSelect = toSignal(
    this.siteSettings.displayLanguageSelect,
    { initialValue: false },
  );

  readonly missingPermissionText = $localize`Your account is not permitted to save its own language. Please ask your administrator.`;

  /** Bumped whenever the permission rules change, to re-evaluate {@link mayChangeLanguage}. */
  private readonly rulesChanged = signal(0);

  /**
   * Whether the permission rules let this user save their own settings.
   * Checks "update" on their own document, because it is the action whose
   * conditions are enforced (also for a document that does not exist yet,
   * for which the save is a "create" that is only checked without conditions).
   */
  readonly mayChangeLanguage = computed(() => {
    this.rulesChanged();
    const userId = this.session()?.id;
    return !!userId && this.ability.can("update", new UserSettings(userId));
  });

  readonly saving = signal(false);

  private readonly languageSelect = viewChild(LanguageSelectComponent);

  constructor() {
    const unsubscribe = this.ability.on("updated", () =>
      this.rulesChanged.update((count) => count + 1),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  /**
   * Save the language for this user and only then apply it,
   * because applying it reloads the app.
   */
  async onLanguageSelected(localeId: string) {
    const locale = this.availableLocales.find((l) => l.id === localeId);
    if (!locale || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      await this.userSettings.setLanguage(locale);
      this.languageService.switchToOwnLocale(localeId);
    } catch (err) {
      this.languageSelect()?.resetToCurrent();
      if (err instanceof EntityPermissionError || isNotPermittedError(err)) {
        // caused by the instance's permission config, not a bug to report
        Logging.debug("User may not save their own language", err);
        this.alertService.addDanger(this.missingPermissionText);
        return;
      }

      Logging.error(
        new Error("Failed to save the user's language", { cause: err }),
      );
      this.alertService.addDanger(
        $localize`Your language could not be saved. Please try again.`,
      );
    } finally {
      this.saving.set(false);
    }
  }
}
