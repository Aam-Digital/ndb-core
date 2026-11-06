import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "./field-validator";

/** `required: true`: the field must have a value */
@Injectable()
export class RequiredValidator extends FieldValidator<boolean> {
  static override readonly key = "required";
  override readonly warning = "never";

  build(): ValidatorFn {
    return Validators.required;
  }

  override message(): string {
    return $localize`This field is required`;
  }
}
