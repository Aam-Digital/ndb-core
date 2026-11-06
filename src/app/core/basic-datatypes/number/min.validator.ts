import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { NumberDatatype } from "./number.datatype";

/** `min: 5`: the number must be at least the given value */
@Injectable()
export class MinValidator extends FieldValidator<number> {
  static override readonly key = "min";
  override readonly datatypesSupported = [NumberDatatype];

  build(value: number): ValidatorFn {
    return Validators.min(value);
  }

  override message(error: { min: number }): string {
    return $localize`Must be greater than ${error.min}`;
  }
}
