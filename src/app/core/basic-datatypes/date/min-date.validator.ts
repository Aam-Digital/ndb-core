import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { DateLimitValidator } from "./date-limit.validator";
import { minDateValidator } from "./date-limit";

/** `minDate: "2020-01-01"` (or `"$now"`): the date must be on or after the given date */
@Injectable()
export class MinDateValidator extends DateLimitValidator {
  static override readonly key = "minDate";
  readonly label = $localize`Minimum Date`;
  protected readonly monthLabel = $localize`Minimum Month`;

  build(value: unknown): ValidatorFn {
    return minDateValidator(value);
  }
}
