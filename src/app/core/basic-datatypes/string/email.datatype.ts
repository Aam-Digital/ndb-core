import { Injectable } from "@angular/core";
import { AbstractControl, ValidationErrors, Validators } from "@angular/forms";
import { StringDatatype } from "./string.datatype";

/** Validator for the value of the field: a valid email address (or no value). */
export function emailValidatorWithMessage(
  control: AbstractControl,
): ValidationErrors | null {
  if (Validators.email(control)) {
    return {
      email: {
        errorMessage: $localize`:form field validation error:Please enter a valid email`,
      },
    };
  }
  return null;
}

/**
 * Datatype for email fields.
 */
@Injectable()
export class EmailDatatype extends StringDatatype {
  static override dataType = "email";
  static override label: string = $localize`:datatype-label:Email`;

  override viewComponent = "DisplayEmail";
  override editComponent = "EditEmail";

  override readonly internalValidators = [emailValidatorWithMessage];
}
