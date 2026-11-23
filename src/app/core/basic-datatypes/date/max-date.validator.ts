import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { DateLimitValidator } from "./date-limit.validator";
import { maxDateValidator } from "./date-limit";

/** `maxDate: "$now"` (or a date): the date must be on or before the given date */
@Injectable()
export class MaxDateValidator extends DateLimitValidator {
  static override readonly key = "maxDate";
  readonly label = $localize`Maximum Date`;

  build(value: unknown): ValidatorFn {
    return maxDateValidator(value);
  }
}
