import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from "@angular/core";
import {
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

@DynamicComponent("EditEmail")
@Component({
  selector: "app-edit-email",
  templateUrl: "./edit-email.component.html",
  styleUrls: ["./edit-email.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditEmailComponent },
  ],
})
export class EditEmailComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();

  ngOnInit() {
    this.formControl.addValidators([emailValidatorWithMessage]);
  }
}

function emailValidatorWithMessage(
  control: AbstractControl,
): ValidationErrors | null {
  const emailError = Validators.email(control);
  if (emailError) {
    return {
      email: {
        errorMessage: $localize`:form field validation error:Please enter a valid email`,
      },
    };
  }
  return null;
}
