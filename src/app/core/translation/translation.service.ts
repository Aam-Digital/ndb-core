import { Inject, Injectable, isDevMode, LOCALE_ID, TRANSLATIONS } from "@angular/core";
import { AlertService } from "../alerts/alert.service";
import { AlertDisplay } from "../alerts/alert-display";
import { extractRegionFromLocale } from "./translation-util";
import { MatDialog } from "@angular/material/dialog";
import { LanguageChangeProcessDialogComponent } from "./language-change-process-dialog/language-change-process-dialog.component";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  /**
   * A readonly array of all locales available
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

  get locales(): string[] {
    return this.availableLocales.map((l) => l.locale);
  }

  /**
   * Switch to a new language while preserving the state of the app.
   * Has no effect when the language is already selected or the locale does not
   * exist
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

  currentLocale(): string {
    const url = window.location.pathname.split("/")[0];
    if (!this.locales.includes(url)) {
      return this.baseLocale;
    } else {
      return url;
    }
  }

  currentRegionCode(): string {
    return extractRegionFromLocale(this.currentLocale());
  }
}
