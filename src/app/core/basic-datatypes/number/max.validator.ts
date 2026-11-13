import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { NumberLimitValidator } from "./number-limit.validator";

/** `max: 10`: the number must be at most the given value */
@Injectable()
export class MaxValidator extends NumberLimitValidator {
  static override readonly key = "max";
  readonly label = $localize`Maximum Value`;

  build(value: number): ValidatorFn {
    return Validators.max(value);
  }

  override message(error: { max: number }): string {
    return $localize`Cannot be greater than ${error.max}`;
  }
}
