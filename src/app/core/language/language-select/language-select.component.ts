import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
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

  availableLocales = input<ConfigurableEnumValue[]>([]);

  /** optional explanation shown below the dropdown, like other form fields' hints */
  hint = input<string>();

  /**
   * Whether picking a language applies it immediately (which reloads the app).
   *
   * Set to false when the caller has to persist the choice first - it then only
   * emits {@link localeChange} and leaves applying it to the caller.
   */
  applyImmediately = input<boolean>(true);

  localeChange = output<string>();

  currentLocale = signal(this.languageService.getCurrentLocale());

  changeLocale(lang: string): void {
    this.currentLocale.set(lang);
    this.localeChange.emit(lang);

    if (this.applyImmediately()) {
      this.languageService.switchLocale(lang);
    }
  }
}
