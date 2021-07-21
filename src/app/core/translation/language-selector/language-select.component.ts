import { Component } from "@angular/core";
import { TranslationService } from "../translation.service";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";

/**
 * Shows a dropdown-menu of available languages
 */
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
   * The relative route the user is currently on
   */
  currentUrl = "";

  constructor(
    private translationService: TranslationService,
    private router: Router
  ) {
    this.siteRegionCode = translationService.currentRegionCode();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
      });
  }

  /**
   * A list of all available languages
   */
  get languageList(): { locale: string; regionCode: string }[] {
    return this.translationService.availableLocales;
  }
}
