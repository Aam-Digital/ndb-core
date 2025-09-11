import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { BooleanInputComponent } from "./boolean-input/boolean-input.component";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";

@DynamicComponent("EditBoolean")
@Component({
  selector: "app-edit-boolean",
  templateUrl: "./edit-boolean.component.html",
  styleUrls: ["./edit-boolean.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BooleanInputComponent],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditBooleanComponent },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EditBooleanComponent extends CustomFormControlDirective<boolean> {
  get formControl(): FormControl<boolean> {
    return this.ngControl.control as FormControl<boolean>;
  }
}
