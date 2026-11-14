import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { ValidatorSettingComponent } from "./validator-setting";

/** Setting of a validation rule that is a number (e.g. the minimum of a number field). */
@DynamicComponent("NumberValidatorSetting")
@Component({
  selector: "app-number-validator-setting",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    HelpButtonComponent,
  ],
  template: `
    <mat-form-field floatLabel="always" class="number-field">
      <mat-label>{{ label() }}</mat-label>
      <input matInput type="number" [formControl]="formControl()" />
      @if (description()) {
        <app-help-button matSuffix [text]="description()" />
      }
    </mat-form-field>
  `,
})
export class NumberValidatorSettingComponent implements ValidatorSettingComponent<number> {
  readonly formControl = input.required<FormControl<number | null>>();
  readonly label = input.required<string>();
  readonly description = input<string>();
}
