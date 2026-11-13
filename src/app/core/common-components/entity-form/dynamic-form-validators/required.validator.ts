import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "./field-validator";

/** `required: true`: the field must have a value */
@Injectable()
export class RequiredValidator extends FieldValidator<boolean> {
  static override readonly key = "required";
  readonly label = $localize`Required Field`;
  override readonly description = $localize`Users always must provide a value in this field`;
  override readonly warning = "never";
  override readonly angularValidator = Validators.required;

  build(): ValidatorFn {
    return Validators.required;
  }

  override message(): string {
    return $localize`This field is required`;
  }
}
