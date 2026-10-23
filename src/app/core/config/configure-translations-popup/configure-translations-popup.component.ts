import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { availableLocales } from "../../language/languages";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import {
  getActiveLocale,
  isLocaleTranslationMap,
} from "../../language/active-locale";
import { pickForLocale, TranslatableText } from "../multi-lingual-config";

export interface ConfigureTranslationsResult {
  /** the new value, or undefined when every language was cleared */
  value: TranslatableText | undefined;
}

export interface ConfigureTranslationsDialogData {
  /** the raw configured value: a plain string or a per-language map */
  value?: TranslatableText;
  /** name of the setting being translated, shown in the dialog */
  fieldLabel?: string;
}

interface TranslationRow {
  locale: string;
  localeLabel: string;
  /** false if the system does not offer this language, and only keeps existing text */
  offered: boolean;
  text: string;
}

/**
 * Edit the translations of one configurable text.
 *
 * Works on the *raw* value and returns a raw value, never resolving anything, so
 * no language can be lost. A plain string with no language added stays a string.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-configure-translations-popup",
  templateUrl: "./configure-translations-popup.component.html",
  styleUrls: ["./configure-translations-popup.component.scss"],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    DialogCloseComponent,
  ],
})
export class ConfigureTranslationsPopupComponent {
  private readonly siteSettings = inject(SiteSettingsService);
  readonly data = inject<ConfigureTranslationsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ConfigureTranslationsPopupComponent>>(MatDialogRef);

  rows: TranslationRow[] = this.buildRows();

  /**
   * One row per language this system offers (in their order), followed by every
   * other language this text already holds text for. {@link buildValue} rebuilds
   * the value from the rows, so leaving one out would delete that text on save.
   *
   * Existing text means: a key of a translation map (a base-language key like `en`
   * counts for `en-US`), or, for a plain string, the active language, which
   * {@link initialTextFor} files it under (so both cases are one check). A language that is not offered and holds
   * no text gets no row, so admins are not invited to write texts in it.
   */
  private buildRows(): TranslationRow[] {
    const offered = this.siteSettings.enabledLocales();
    const isOffered = (locale: ConfigurableEnumValue) =>
      offered.some(({ id }) => id === locale.id);

    const existing = availableLocales.values.filter(
      (locale) => !isOffered(locale) && !!this.initialTextFor(locale.id),
    );

    return [
      ...offered.map((locale) => ({ locale, offered: true })),
      ...existing.map((locale) => ({ locale, offered: false })),
    ].map(({ locale, offered }) => ({
      locale: locale.id,
      localeLabel: locale.label,
      offered,
      text: this.initialTextFor(locale.id),
    }));
  }

  private initialTextFor(locale: string): string {
    const value = this.data?.value;
    if (isLocaleTranslationMap(value)) {
      // also reads a hand-written base-language key (`en` for `en-US`), so that
      // saving normalises it to the locale id instead of dropping it
      return pickForLocale(value, locale) ?? "";
    }
    // a plain string becomes the translation of the language the admin is reading
    // it in: on a German instance, filing it under English would show the wrong text
    return locale === getActiveLocale() && typeof value === "string"
      ? value
      : "";
  }

  onSave() {
    this.dialogRef.close({ value: this.buildValue() });
  }

  onCancel() {
    // no result at all, so the caller keeps the existing value
    this.dialogRef.close(undefined);
  }

  /**
   * Build the new raw value. Only the active language on its own collapses back to
   * a plain string, and only if the dialog was opened with one: a map saved as a
   * string would look unchanged to the config merge, which would then restore the
   * translations just removed.
   */
  private buildValue(): TranslatableText | undefined {
    const filled = this.rows.filter((row) => !!row.text?.trim());

    if (filled.length === 0) {
      return undefined;
    }
    if (
      filled.length === 1 &&
      filled[0].locale === getActiveLocale() &&
      !isLocaleTranslationMap(this.data?.value)
    ) {
      return filled[0].text.trim();
    }

    const map: Record<string, string> = {};
    for (const row of filled) {
      map[row.locale] = row.text.trim();
    }
    return map;
  }
}
