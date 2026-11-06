import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import {
  checkRange,
  isEmptyRange,
  RangeConfig,
  RangeError,
} from "../../common-components/entity-form/dynamic-form-validators/range-config";
import { calculateAge } from "../../../utils/utils";
import { parseToDate } from "../date/date-range.validator";
import { DateWithAgeDatatype } from "./date-with-age.datatype";

/** `ageRange: { min: 6, max: 18 }`: the age calculated from the date of birth must be within the given range of years */
@Injectable()
export class AgeRangeValidator extends FieldValidator<RangeConfig<number>> {
  static override readonly key = "ageRange";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  override isSwitchedOff(value: RangeConfig<number>): boolean {
    return isEmptyRange(value);
  }

  build({ min, max }: RangeConfig<number>): ValidatorFn {
    const range = { min: toYears(min), max: toYears(max) };
    return (control) => {
      const dateOfBirth = parseToDate(control.value);
      const error = dateOfBirth
        ? checkRange(calculateAge(dateOfBirth), range)
        : null;
      return error ? { ageRange: error } : null;
    };
  }

  override message({ min, max }: RangeError<number>): string {
    if (min !== undefined && max !== undefined) {
      return $localize`Age must be between ${min} and ${max} years`;
    }
    return min === undefined
      ? $localize`Age must be at most ${max} years`
      : $localize`Age must be at least ${min} years`;
  }
}

function toYears(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const years = Number(value);
  return Number.isFinite(years) ? years : undefined;
}
