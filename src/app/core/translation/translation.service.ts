import { Inject, Injectable, isDevMode, LOCALE_ID } from "@angular/core";
import { AlertService } from "../alerts/alert.service";
import { AlertDisplay } from "../alerts/alert-display";
import { extractRegionFromLocale } from "./translation-util";
import { MatDialog } from "@angular/material/dialog";
import { LanguageChangeProcessDialogComponent } from "./language-change-process-dialog/language-change-process-dialog.component";

/**
 * Service that contains
 * <li>The currently selected language
 * <li>All available languages
 * <br/>
 * As well as methods to change the currently selected language
 */
@Injectable({
  providedIn: "root",
})
export class TranslationService {
  /**
   * A readonly array of all locales available
   * TODO: Hardcoded
   */
  readonly availableLocales: { locale: string; regionCode: string }[] = [];
  constructor(
    @Inject(LOCALE_ID) private baseLocale: string,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {
    this.availableLocales = [
      { locale: "de", regionCode: "de" },
      { locale: "en-US", regionCode: "us" },
    ];
  }

  /**
   * returns all available locales without region code
   * i.e. only 'en-US' instead of 'en-US' <i>and</i> 'us'
   */
  get locales(): string[] {
    return this.availableLocales.map((l) => l.locale);
  }

  /**
   * Switch to a new language while preserving the state of the app.
   * Has no effect when the language is already selected or the locale does not
   * exist.
   * <br/>This method will also indicate to the user that the language change
   * might take some time by showing a dialog. This dialog cannot be clicked
   * away. After selecting the new language, this method will route to the base
   * page, i.e. where the user currently is is disregarded
   * <br/>This has no effect in dev mode (other than showing an alert)
   * @param locale The locale (e.g. 'en-US') or region code (e.g. 'de')
   * to switch to.
   */
  switchToLanguage(locale: string) {
    if (this.currentLocale() === locale || !this.locales.includes(locale)) {
      return;
    }
    if (isDevMode()) {
      this.alertService.addWarning(
        "Language change is not supported in development mode",
        AlertDisplay.TEMPORARY
      );
    } else {
      LanguageChangeProcessDialogComponent.show(this.dialog);
      window.location.pathname = `/${locale}`;
    }
  }

  /**
   * Returns the locale currently used by the user
   */
  currentLocale(): string {
    const url = window.location.pathname.split("/")[0];
    if (!this.locales.includes(url)) {
      return this.baseLocale;
    } else {
      return url;
    }
  }

  /**
   * returns the region code of the locale currently used
   */
  currentRegionCode(): string {
    return extractRegionFromLocale(this.currentLocale());
  }
}
