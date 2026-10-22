import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { AlertService } from "../../alerts/alert.service";
import { LanguageSelectComponent } from "../../language/language-select/language-select.component";
import { LanguageService } from "../../language/language.service";
import { availableLocales } from "../../language/languages";
import { Logging } from "../../logging/logging.service";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { UserSettingsService } from "../../site-settings/user-settings.service";

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

  readonly availableLocales = availableLocales.values;

  readonly enabledLocales = this.siteSettings.enabledLocales;

  readonly languageHint = $localize`:User Profile - language setting hint:Only applies to your account. The app reloads when you change it.`;

  /** admins can hide the language selector for their system */
  readonly displayLanguageSelect = this.siteSettings.showLanguageSelect;

  readonly saving = signal(false);

  private readonly languageSelect = viewChild(LanguageSelectComponent);

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
      this.languageService.switchLocale(localeId);
    } catch (err) {
      Logging.error(
        new Error("Failed to save the user's language", { cause: err }),
      );
      this.languageSelect()?.resetToCurrent();
      this.alertService.addDanger(
        $localize`Your language could not be saved. Please try again.`,
      );
    } finally {
      this.saving.set(false);
    }
  }
}
