import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import {
  checkRange,
  isEmptyRange,
  RangeConfig,
  RangeError,
} from "../../common-components/entity-form/dynamic-form-validators/range-config";
import { NumberDatatype } from "./number.datatype";

/** `range: { min: 0, max: 100 }`: the number must be within the given range (either end can be left out) */
@Injectable()
export class RangeValidator extends FieldValidator<RangeConfig<number>> {
  static override readonly key = "range";
  override readonly datatypesSupported = [NumberDatatype];

  override isSwitchedOff(value: RangeConfig<number>): boolean {
    return isEmptyRange(value);
  }

  build({ min, max }: RangeConfig<number>): ValidatorFn {
    const range = { min: toNumber(min), max: toNumber(max) };
    return (control) => {
      const value = toNumber(control.value);
      const error = value === undefined ? null : checkRange(value, range);
      return error ? { range: error } : null;
    };
  }

  override message({ min, max }: RangeError<number>): string {
    if (min !== undefined && max !== undefined) {
      return $localize`Must be between ${min} and ${max}`;
    }
    return min === undefined
      ? $localize`Must be at most ${max}`
      : $localize`Must be at least ${min}`;
  }
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
