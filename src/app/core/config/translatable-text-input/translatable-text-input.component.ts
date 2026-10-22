import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EditComponent } from "../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import {
  getActiveLocale,
  isLocaleTranslationMap,
  resolveLocaleText,
} from "../../language/active-locale";
import { DynamicComponent } from "../dynamic-components/dynamic-component.decorator";
import {
  ConfigureTranslationsPopupComponent,
  ConfigureTranslationsResult,
} from "../configure-translations-popup/configure-translations-popup.component";
import { TranslatableText } from "../multi-lingual-config";

/**
 * Input for a configurable text that can be translated into multiple languages.
 *
 * The form control holds the *raw* value, while the field shows and edits only the
 * active language - so editing never drops the other translations. The button
 * opens a dialog to edit them all.
 *
 * Use inside a `mat-form-field`, so the caller keeps control over label and errors:
 * ```html
 * <mat-form-field>
 *   <mat-label i18n>Label</mat-label>
 *   <app-translatable-text-input formControlName="label"></app-translatable-text-input>
 * </mat-form-field>
 * ```
 */
@DynamicComponent("EditTranslatableText")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-translatable-text-input",
  host: {
    "[class.is-multiline]": "isMultiline()",
    // the placeholder belongs on the inner text field only - leaving it on
    // the host too would make it match twice when queried by placeholder
    "[attr.placeholder]": "null",
  },
  templateUrl: "./translatable-text-input.component.html",
  styleUrls: ["./translatable-text-input.component.scss"],
  imports: [
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    FaDynamicIconComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: TranslatableTextInputComponent,
    },
  ],
})
export class TranslatableTextInputComponent
  extends CustomFormControlDirective<TranslatableText>
  implements EditComponent
{
  override controlType = "translatable-text-input";

  formFieldConfig = input<FormFieldConfig>();

  /** show a multi-line textarea instead of a single-line input */
  multiline = input(false);
  rows = input(3);

  readonly isMultiline = computed(
    () => this.multiline() || !!this.formFieldConfig()?.additional?.multiline,
  );
  readonly rowCount = computed(
    () => this.formFieldConfig()?.additional?.rows ?? this.rows(),
  );

  /** set false when the form field has its own suffix icon row, and call {@link openTranslations} from there */
  showTranslationsButton = input(true);

  private readonly dialog = inject(MatDialog);

  /** the text of the currently active language, shown in the text field */
  readonly displayText = computed(() => {
    const value = this.valueSignal();
    const resolved = resolveLocaleText(value) ?? "";

    if (!isLocaleTranslationMap(value)) {
      return resolved;
    }
    // an already-present slot wins over the resolved fallback, even when empty -
    // otherwise clearing the text would snap back to another language
    return value[getActiveLocale()] ?? resolved;
  });

  /** whether this text is currently configured in more than one language */
  readonly isMultiLingual = computed(() =>
    isLocaleTranslationMap(this.valueSignal()),
  );

  /**
   * Apply text typed by the user to the active language only,
   * keeping any other languages of a multi-lingual value untouched.
   */
  onTextInput(text: string) {
    const current = this.valueSignal();
    this.applyValue(
      isLocaleTranslationMap(current)
        ? { ...current, [getActiveLocale()]: text }
        : text,
    );
  }

  /**
   * As an `editComponent` the surrounding DynamicEditComponent is the registered
   * ControlValueAccessor, so `onChange` here is a no-op: write to the bound
   * FormControl too, or the edit is discarded on save.
   */
  private applyValue(newValue: TranslatableText | undefined) {
    this.value = newValue;

    const control = this.formControl;
    if (control && control.value !== newValue) {
      control.setValue(newValue);
      control.markAsDirty();
    }
  }

  openTranslations(event: Event) {
    event.stopPropagation();

    this.dialog
      .open(ConfigureTranslationsPopupComponent, {
        data: {
          value: this.valueSignal(),
          // only set on the entity-form path; the admin UIs render their own label
          fieldLabel: resolveLocaleText(this.formFieldConfig()?.label),
        },
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result?: ConfigureTranslationsResult) => {
        if (!result) {
          // cancelled: keep the previously configured value
          return;
        }
        // saved, possibly with every language cleared
        this.applyValue(result.value);
        this.onTouched();
      });
  }
}
