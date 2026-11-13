import { Injectable } from "@angular/core";
import { AgeLimitValidator } from "./age-limit.validator";

/** `minAge: 6`: the age calculated from the date of birth must be at least the given number of years */
@Injectable()
export class MinAgeValidator extends AgeLimitValidator {
  static override readonly key = "minAge";
  readonly label = $localize`Minimum Age (Years)`;
  override readonly description = $localize`Enter the minimum allowed age in years. This is independent from the date limits.`;
}
