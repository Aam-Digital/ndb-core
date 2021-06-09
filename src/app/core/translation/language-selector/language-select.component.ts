import { Component, OnInit } from "@angular/core";
import { TranslationService } from "../translation.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { startWith } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";

/**
 * Shows a dropdown-menu of available languages
 */
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
})
@UntilDestroy()
export class LanguageSelectComponent {
  /**
   * The region code of the currently selected language/region
   */
  siteRegionCode: string;

  constructor(private translationService: TranslationService) {
    this.siteRegionCode = translationService.currentRegionCode();
  }

  /**
   * A list of all available languages
   */
  get languageList(): { locale: string; regionCode: string }[] {
    return this.translationService.availableLocales;
  }

  /**
   * Selects a new language
   * @param selectedLang The new locale to select. Must be a valid locale and
   * <em>not</em> only the region-code
   */
  select(selectedLang: string) {
    this.translationService.switchToLanguage(selectedLang);
  }
}
