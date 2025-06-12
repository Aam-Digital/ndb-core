import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
} from "@angular/core";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "../language-statics";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";

/**
 * Shows a dropdown-menu of available languages
 */
@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
  imports: [MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
  @Input() availableLocales: ConfigurableEnumValue[] = [];

  currentLocale: string;

  constructor(@Inject(LOCATION_TOKEN) private location: Location) {
    this.currentLocale = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
  }

  changeLocale(lang: string) {
    if (lang === this.currentLocale) return;
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, lang);
    this.location.reload();
  }
}
