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
import { DEFAULT_LANGUAGE } from "../../language/language-statics";
import { isTranslatableText, TranslatableText } from "../multi-lingual-config";

export interface ConfigureTranslationsDialogData {
  /** the raw configured value: a plain string or a per-language map */
  value?: TranslatableText;
  /** name of the setting being translated, shown in the dialog */
  fieldLabel?: string;
}

interface TranslationRow {
  locale: string;
  localeLabel: string;
  text: string;
}

/**
 * Edit the translations of one configurable text
 *
 * Works on the *raw* config value (plain string or per-language map) and returns
 * a new raw value - it never resolves anything, so no language can be lost here.
 * A value that ends up with only one language is returned as a plain string
 * again, keeping configs that don't need multiple languages simple.
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
  readonly data = inject<ConfigureTranslationsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ConfigureTranslationsPopupComponent>>(MatDialogRef);

  private readonly validLocaleIds = availableLocales.values.map((v) => v.id);

  rows: TranslationRow[] = availableLocales.values.map((locale) => ({
    locale: locale.id,
    localeLabel: locale.label,
    text: this.initialTextFor(locale.id),
  }));

  private initialTextFor(locale: string): string {
    const value = this.data?.value;
    if (isTranslatableText(value, this.validLocaleIds)) {
      return value[locale] ?? "";
    }
    // a plain string so far: it is the text everyone sees today, so it becomes
    // the default language's translation
    return locale === DEFAULT_LANGUAGE && typeof value === "string"
      ? value
      : "";
  }

  onSave() {
    this.dialogRef.close(this.buildValue());
  }

  onCancel() {
    // closing without a result leaves the existing value untouched
    this.dialogRef.close(undefined);
  }

  /**
   * Build the new raw value: a plain string while only one language is filled in,
   * a per-language map as soon as there are several.
   */
  private buildValue(): TranslatableText | undefined {
    const filled = this.rows.filter((row) => !!row.text?.trim());

    if (filled.length === 0) {
      return undefined;
    }
    if (filled.length === 1) {
      return filled[0].text.trim();
    }

    const map: Record<string, string> = {};
    for (const row of filled) {
      map[row.locale] = row.text.trim();
    }
    return map;
  }
}
