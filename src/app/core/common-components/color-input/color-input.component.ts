import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgTemplateOutlet } from "@angular/common";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

/**
 * Edit component for color fields.
 * Can be used as an EditComponent in entity forms (registered as "EditColor"),
 * or as a standalone component with [value]/(valueChange) bindings.
 */
@DynamicComponent("EditColor")
@Component({
  selector: "app-color-input",
  standalone: true,
  templateUrl: "./color-input.component.html",
  styleUrl: "./color-input.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: ColorInputComponent },
  ],
})
export class ColorInputComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  @Input() formFieldConfig?: FormFieldConfig;

  /**
   * If true, renders only the compact color picker button (no label, no text field, no form field).
   * Useful for inline/icon-only usage.
   */
  @Input() compact = false;

  /**
   * Label for the color input field (used in standalone full mode).
   */
  @Input() label: string = $localize`Color`;

  private readonly destroyRef = inject(DestroyRef);

  HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
  /**
   * Internal form control for the text input in standalone mode.
   */
  readonly colorControl = new FormControl<string>("", { nonNullable: true });

  /**
   * The external form control provided by Angular Forms (only present in EditComponent mode).
   */
  get formControl(): FormControl<string> {
    return this.ngControl?.control as FormControl<string>;
  }

  ngOnInit() {
    if (this.formControl) {
      this.formControl.valueChanges
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => !this.formControl.disabled),
        )
        .subscribe((value) => this.validateHex(value));
    } else {
      this.colorControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => {
          if (!value || this.HEX_COLOR_PATTERN.test(value)) {
            this.colorControl.setErrors(null);
            this._value = value;
            this.stateChanges.next();
            this.valueChange.emit(value);
          } else {
            this.colorControl.setErrors({ pattern: true });
          }
        });
    }
  }

  override writeValue(value: string, notifyFormControl = false): void {
    if (!this.formControl) {
      if (this.colorControl.value !== (value ?? "")) {
        this.colorControl.setValue(value ?? "", { emitEvent: false });
      }
    }
    if (JSON.stringify(value) === JSON.stringify(this._value)) return;
    this._value = value;
    if (notifyFormControl) {
      this.onChange(value);
    }
    this.stateChanges.next();
  }

  onColorPickerChange(value: string) {
    if (this.formControl) {
      this.formControl.setValue(value);
    } else {
      this.colorControl.setValue(value);
    }
  }

  private validateHex(value: string): void {
    if (!value || this.HEX_COLOR_PATTERN.test(value)) {
      this.formControl?.setErrors(null);
    } else {
      this.formControl?.setErrors({
        invalidHex: {
          errorMessage: $localize`Please enter a valid hex color code (e.g. #ff0000)`,
        },
      });
    }
  }

  get colorPickerValue(): string {
    const val = this.formControl?.value ?? this.colorControl.value;
    return val && this.HEX_COLOR_PATTERN.test(val) ? val : "#000000";
  }
}
