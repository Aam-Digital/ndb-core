import { Injectable } from "@angular/core";
import { NumberLimitValidator } from "./number-limit.validator";

/** `max: 10`: the number must be at most the given value */
@Injectable()
export class MaxValidator extends NumberLimitValidator {
  static override readonly key = "max";
  readonly label = $localize`Maximum Value`;
}
