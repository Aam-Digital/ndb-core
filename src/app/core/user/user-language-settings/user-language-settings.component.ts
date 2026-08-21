import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LanguageSelectComponent } from "../../language/language-select/language-select.component";
import { LanguageService } from "../../language/language.service";
import { availableLocales } from "../../language/languages";
import { Logging } from "../../logging/logging.service";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { UserSettingsService } from "../../site-settings/user-settings.service";

/**
 * Lets a user pick the language for their own account.
 *
 * The choice is stored for this user only, so different users of the same system
 * can each use their own language. Users who never pick one keep following the
 * system-wide default set by an admin.
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
  private readonly snackBar = inject(MatSnackBar);

  readonly availableLocales = availableLocales.values;

  readonly languageHint = $localize`:User Profile - language setting hint:Only applies to your account. The app reloads when you change it.`;

  /** admins can hide the language selector for their system */
  readonly displayLanguageSelect = toSignal(
    this.siteSettings.displayLanguageSelect,
    { initialValue: false },
  );

  readonly saving = signal(false);

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
      this.snackBar.open(
        $localize`Your language could not be saved. Please try again.`,
      );
    } finally {
      this.saving.set(false);
    }
  }
}
