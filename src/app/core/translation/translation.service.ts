import { Inject, Injectable, isDevMode, LOCALE_ID } from "@angular/core";
import { Router } from "@angular/router";
import { AlertService } from "../alerts/alert.service";
import { AlertDisplay } from "../alerts/alert-display";
import { Observable, Subject } from "rxjs";
import { extractRegionFromLocale } from "./translation-util";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  get onLanguageChange(): Observable<string> {
    return this.languageChangeSubject.asObservable();
  }

  /**
   * A subject that emits whenever the language changes, after navigating to the
   * new language page
   */
  private languageChangeSubject = new Subject<string>();

  /**
   * A readonly array of all locales available
   */
  readonly availableLocales: string[] = [];
  constructor(
    @Inject(LOCALE_ID) private baseLocale: string,
    private router: Router,
    private alertService: AlertService
  ) {
    const localesObj: object = global["ng"].common.locales;
    for (const key in localesObj) {
      if (!localesObj.hasOwnProperty(key)) {
        continue;
      }
      this.availableLocales.push(key);
    }
  }

  /**
   * Switch to a new language while preserving the state of the app.
   * Has no effect when the language is already selected or the locale does not
   * exist
   * @param locale The locale (e.g. 'en-US') or region code (e.g. 'de')
   * to switch to.
   */
  async switchToLanguage(locale: string) {
    const languageRegionCode = extractRegionFromLocale(locale);
    if (
      this.currentLocale() === languageRegionCode ||
      !this.availableLocales.includes(languageRegionCode)
    ) {
      return;
    }
    if (isDevMode()) {
      this.alertService.addWarning(
        "Language change is not supported in development mode",
        AlertDisplay.TEMPORARY
      );
    } else {
      const url = this.router.url.split("/");
      if (url.length < 2) {
        return;
      } else {
        url[1] = languageRegionCode;
        await this.router.navigate(url);
        this.languageChangeSubject.next(languageRegionCode);
      }
    }
  }

  currentLocale(): string {
    const url = this.router.url.split("/");
    if (url.length < 2) {
      return this.baseLocale;
    } else {
      return url[1];
    }
  }
}
