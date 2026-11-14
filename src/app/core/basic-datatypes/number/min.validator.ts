import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { NumberLimitValidator } from "./number-limit.validator";

/** `min: 5`: the number must be at least the given value */
@Injectable()
export class MinValidator extends NumberLimitValidator {
  static override readonly key = "min";
  readonly label = $localize`Minimum Value`;

  build(value: number): ValidatorFn {
    return Validators.min(value);
  }

  override message(error: { min: number }): string {
    return $localize`Must be greater than ${error.min}`;
  }
}
