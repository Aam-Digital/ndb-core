import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-statics";
import { LOCALE_ENUM_ID } from "../languages";
import { ConfigurableEnumDirective } from "../../basic-datatypes/configurable-enum/configurable-enum-directive/configurable-enum.directive";
import { MatSelectModule } from "@angular/material/select";

/**
 * Shows a dropdown-menu of available languages
 */
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
  imports: [ConfigurableEnumDirective, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
  localeEnumId = LOCALE_ENUM_ID;
  currentLocale: string;

  constructor(@Inject(LOCATION_TOKEN) private location: Location) {
    this.currentLocale = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
  }

  changeLocale(lang: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, lang);
    this.location.reload();
  }
}
