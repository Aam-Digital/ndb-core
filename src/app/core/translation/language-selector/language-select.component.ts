import { Component, Inject } from "@angular/core";
import { TranslationService } from "../translation.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LOCATION_LOCAL_STORAGE_KEY } from "../location-key";

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

  constructor(
    public translationService: TranslationService,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {
    this.siteRegionCode = translationService.currentRegionCode();
  }

  changeLocale(lang: string) {
    localStorage.setItem(LOCATION_LOCAL_STORAGE_KEY, lang);
    this.location.reload();
  }
}
