import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { LanguageService } from "#src/app/core/language/language.service";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";

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
  private readonly unsavedChanges = inject(UnsavedChangesService);

  availableLocales = input<ConfigurableEnumValue[]>([]);

  currentLocale = signal(this.languageService.getCurrentLocale());

  /**
   * Switching reloads the page, which would silently discard anything already
   * typed into a form (e.g. a half-filled public form), so ask first.
   */
  async changeLocale(lang: string): Promise<void> {
    const previous = this.currentLocale();
    this.currentLocale.set(lang);

    if (!(await this.unsavedChanges.checkUnsavedChanges())) {
      this.currentLocale.set(previous);
      return;
    }

    this.languageService.switchLocale(lang);
  }
}
