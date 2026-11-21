import { Injectable } from "@angular/core";
import { NumberLimitValidator } from "./number-limit.validator";

/** `min: 5`: the number must be at least the given value */
@Injectable()
export class MinValidator extends NumberLimitValidator {
  static override readonly key = "min";
  readonly label = $localize`Minimum Value`;
}
