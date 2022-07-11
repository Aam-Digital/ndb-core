import { Component } from "@angular/core";
import { TranslationService } from "../translation.service";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * Shows a dropdown-menu of available languages
 */
@UntilDestroy()
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
})
export class LanguageSelectComponent {
  /**
   * The region code of the currently selected language/region
   */
  siteRegionCode: string;

  /**
   * The relative route the user is currently on without query params
   */
  currentUrl = "";

  constructor(
    private translationService: TranslationService,
    private router: Router
  ) {
    this.siteRegionCode = translationService.currentRegionCode();
    this.router.events
      .pipe(
        untilDestroyed(this),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => (this.currentUrl = this.router.url.split("?")[0]));
  }

  /**
   * A list of all available languages
   */
  get languageList(): { locale: string; regionCode: string }[] {
    return this.translationService.availableLocales;
  }
}
