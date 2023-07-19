import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { LanguageService } from "../language.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-statics";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { NgForOf } from "@angular/common";

/**
 * Shows a dropdown-menu of available languages
 */
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
  imports: [MatButtonModule, MatIconModule, MatMenuModule, NgForOf],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
  /**
   * The region code of the currently selected language/region
   */
  siteRegionCode: string;

  constructor(
    public translationService: LanguageService,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {
    this.siteRegionCode = translationService.currentRegionCode();
  }

  changeLocale(lang: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, lang);
    this.location.reload();
  }
}
