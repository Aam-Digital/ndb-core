import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
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
  imports: [MatSelectModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
  private readonly languageService = inject(LanguageService);
  private readonly unsavedChanges = inject(UnsavedChangesService);

  availableLocales = input<ConfigurableEnumValue[]>([]);

  /**
   * Which of {@link availableLocales} can actually be picked. The rest stay visible
   * but disabled, so it is clear the system could enable them. Empty means all.
   */
  enabledLocales = input<ConfigurableEnumValue[]>([]);

  /** optional explanation shown below the dropdown, like other form fields' hints */
  hint = input<string>();

  /**
   * Whether picking a language applies it immediately (which reloads the app).
   *
   * Set to false when the caller has to persist the choice first - it then only
   * emits {@link localeChange} and leaves applying it to the caller.
   */
  applyImmediately = input<boolean>(true);

  /** block further picks, e.g. while the caller is still saving the last one */
  disabled = input<boolean>(false);

  localeChange = output<string>();

  currentLocale = signal(this.languageService.getCurrentLocale());

  /** short marker in the option text, so keyboard and touch users see why it is disabled */
  readonly notAvailableMarker = $localize`:Language select - marker for a disabled option:not available`;

  readonly disabledHint = $localize`:Language select - disabled option tooltip:Your administrator has not enabled this language for this system.`;

  /** {@link availableLocales} with a flag whether each can be picked */
  readonly options = computed(() => {
    const enabledIds = new Set(this.enabledLocales().map(({ id }) => id));
    return this.availableLocales().map((locale) => ({
      id: locale.id,
      label: locale.label,
      enabled: enabledIds.size === 0 || enabledIds.has(locale.id),
    }));
  });

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

    this.localeChange.emit(lang);

    if (this.applyImmediately()) {
      this.languageService.switchLocale(lang);
    }
  }

  /** revert to the active locale, for a caller that failed to persist the choice */
  resetToCurrent(): void {
    this.currentLocale.set(this.languageService.getCurrentLocale());
  }
}
