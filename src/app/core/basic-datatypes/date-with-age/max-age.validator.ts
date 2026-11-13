import { Injectable } from "@angular/core";
import { AgeLimitValidator } from "./age-limit.validator";

/** `maxAge: 18`: the age calculated from the date of birth must be at most the given number of years */
@Injectable()
export class MaxAgeValidator extends AgeLimitValidator {
  static override readonly key = "maxAge";
  protected readonly limit = "maxAge";
  readonly label = $localize`Maximum Age (Years)`;
  override readonly description = $localize`Enter the maximum allowed age in years. This is independent from the date limits.`;
}
