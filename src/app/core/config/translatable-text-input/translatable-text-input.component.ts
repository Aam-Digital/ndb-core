import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { DEFAULT_LANGUAGE } from "../../language/language-statics";
import { availableLocales } from "../../language/languages";
import { ConfigureTranslationsPopupComponent } from "../configure-translations-popup/configure-translations-popup.component";
import {
  isTranslatableText,
  resolveTranslatableText,
  TranslatableText,
} from "../multi-lingual-config";

/**
 * Input for a configurable text that can be translated into multiple languages.
 *
 * The bound form control holds the *raw* value - either a plain string or a
 * per-language map - while the text field itself only shows and edits the text of
 * the currently active language. Editing the text field therefore never drops the
 * translations of other languages, and the button opens a dialog to edit them all.
 *
 * Use inside a `mat-form-field`, so the caller keeps control over label and errors:
 * ```html
 * <mat-form-field>
 *   <mat-label i18n>Label</mat-label>
 *   <app-translatable-text-input formControlName="label"></app-translatable-text-input>
 * </mat-form-field>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-translatable-text-input",
  host: {
    "[class.is-multiline]": "multiline()",
  },
  templateUrl: "./translatable-text-input.component.html",
  styleUrls: ["./translatable-text-input.component.scss"],
  imports: [
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: TranslatableTextInputComponent },
  ],
})
export class TranslatableTextInputComponent extends CustomFormControlDirective<TranslatableText> {
  override controlType = "translatable-text-input";

  /** show a multi-line textarea instead of a single-line input */
  multiline = input(false);
  rows = input(3);

  private readonly dialog = inject(MatDialog);
  private readonly locale = inject(LOCALE_ID);
  private readonly validLocaleIds = availableLocales.values.map((v) => v.id);

  /** the text of the currently active language, shown in the text field */
  readonly displayText = computed(
    () =>
      resolveTranslatableText(
        this.valueSignal(),
        this.locale,
        DEFAULT_LANGUAGE,
        this.validLocaleIds,
      ) ?? "",
  );

  /** whether this text is currently configured in more than one language */
  readonly isMultiLingual = computed(() =>
    isTranslatableText(this.valueSignal(), this.validLocaleIds),
  );

  /**
   * Apply text typed by the user to the active language only,
   * keeping any other languages of a multi-lingual value untouched.
   */
  onTextInput(text: string) {
    const current = this.valueSignal();
    this.value = isTranslatableText(current, this.validLocaleIds)
      ? { ...current, [this.locale]: text }
      : text;
  }

  openTranslations(event: Event) {
    event.stopPropagation();

    this.dialog
      .open(ConfigureTranslationsPopupComponent, {
        data: { value: this.valueSignal() },
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result?: TranslatableText) => {
        if (result === undefined) {
          // dialog cancelled: keep the previously configured value
          return;
        }
        this.value = result;
        this.onTouched();
      });
  }
}
