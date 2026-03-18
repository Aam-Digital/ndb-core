import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

/**
 * Edit component for color fields.
 * Provides a text input for hex color codes and a native color picker button.
 * Only valid hex color strings (e.g. #ff0000) are accepted; invalid values are flagged as errors.
 */
@DynamicComponent("EditColor")
@Component({
  selector: "app-edit-color",
  templateUrl: "./edit-color.component.html",
  styleUrl: "./edit-color.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditColorComponent },
  ],
})
export class EditColorComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  private static readonly HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

  @Input() formFieldConfig?: FormFieldConfig;

  private readonly destroyRef = inject(DestroyRef);

  get formControl(): FormControl<string> {
    return this.ngControl?.control as FormControl<string>;
  }

  ngOnInit() {
    this.formControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.validateColor(value);
      });
  }

  onColorPickerChange(value: string) {
    this.formControl?.setValue(value);
  }

  private validateColor(value: string): void {
    if (!value) {
      this.formControl?.setErrors(null);
      return;
    }
    if (!EditColorComponent.HEX_COLOR_PATTERN.test(value)) {
      this.formControl?.setErrors({ invalidHex: true });
    } else {
      this.formControl?.setErrors(null);
    }
  }

  /** Safe getter for the current color value for display in the picker. */
  get colorPickerValue(): string {
    const val = this.formControl?.value;
    return val && EditColorComponent.HEX_COLOR_PATTERN.test(val)
      ? val
      : "#000000";
  }
}
