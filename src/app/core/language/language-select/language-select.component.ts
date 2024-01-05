import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { LanguageService } from "../language.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-statics";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { NgForOf } from "@angular/common";
import { LOCALE_ENUM_ID } from "../languages";
import { ConfigurableEnumDirective } from "../../basic-datatypes/configurable-enum/configurable-enum-directive/configurable-enum.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Shows a dropdown-menu of available languages
 */
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgForOf,
    ConfigurableEnumDirective,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
  localeEnumId = LOCALE_ENUM_ID;
  /**
   * The region code of the currently selected language/region
   */
  siteRegionCode = this.translationService.currentRegionCode();

  constructor(
    private translationService: LanguageService,
    @Inject(LOCATION_TOKEN) private location: Location,
  ) {}

  changeLocale(lang: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, lang);
    this.location.reload();
  }
}
