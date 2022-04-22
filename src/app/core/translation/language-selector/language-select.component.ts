import { Component } from "@angular/core";
import { TranslationService } from "../translation.service";

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

  constructor(public translationService: TranslationService) {
    this.siteRegionCode = translationService.currentRegionCode();
  }

  changeLocale(lang: string) {
    localStorage.setItem("locale", lang);
    window.location.reload();
  }
}
