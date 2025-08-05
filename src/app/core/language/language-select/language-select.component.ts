import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { LanguageService } from "#src/app/core/language/language.service";

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
  private readonly languageService = inject(LanguageService);

  @Input() availableLocales: ConfigurableEnumValue[] = [];

  currentLocale: string;

  constructor() {
    this.currentLocale = this.languageService.getCurrentLocale();
  }

  changeLocale(lang: string) {
    this.languageService.switchLocale(lang);
  }
}
