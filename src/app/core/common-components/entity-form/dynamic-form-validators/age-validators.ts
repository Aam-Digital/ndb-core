import { Injectable } from "@angular/core";
import { AbstractControl, ValidatorFn } from "@angular/forms";
import { DateWithAgeDatatype } from "../../../basic-datatypes/date-with-age/date-with-age.datatype";
import { FieldValidator, ValidatorContext } from "./field-validator";
import { calculateAge } from "../../../../utils/utils";
import { parseToDate } from "./date-validators";

/** the minimum and maximum age configured for a field (either can be missing) */
export interface AgeRange {
  minAge?: unknown;
  maxAge?: unknown;
}

/**
 * Creates the validator for one end of the configured age range.
 * The error also carries the other end, if configured, to word it as a range ("between ... and ...").
 */
function ageRangeValidator(
  end: "minAge" | "maxAge",
  ageRange: AgeRange,
): ValidatorFn {
  const limit = Number(ageRange[end]);
  if (!Number.isFinite(limit)) {
    return () => null;
  }
  const configuredMinAge = Number(ageRange.minAge);
  const configuredMaxAge = Number(ageRange.maxAge);

  return (control: AbstractControl) => {
    const controlDate = parseToDate(control.value);
    if (!controlDate) {
      return null;
    }
    const age = calculateAge(controlDate);
    const fits = end === "minAge" ? age >= limit : age <= limit;
    if (fits) {
      return null;
    }
    return {
      [end]: {
        currentAge: age,
        ...(Number.isFinite(configuredMinAge) && { minAge: configuredMinAge }),
        ...(Number.isFinite(configuredMaxAge) && { maxAge: configuredMaxAge }),
      },
    };
  };
}

export function descriptionForAgeValidator(
  validator: "minAge" | "maxAge",
  validationValue: any,
): string {
  switch (validator) {
    case "minAge":
      if (
        Number.isFinite(validationValue?.minAge) &&
        Number.isFinite(validationValue?.maxAge)
      ) {
        return $localize`Age must be between ${validationValue.minAge} and ${validationValue.maxAge} years`;
      }
      return $localize`Age must be at least ${validationValue.minAge} years`;
    case "maxAge":
      if (
        Number.isFinite(validationValue?.minAge) &&
        Number.isFinite(validationValue?.maxAge)
      ) {
        return $localize`Age must be between ${validationValue.minAge} and ${validationValue.maxAge} years`;
      }
      return $localize`Age must be at most ${validationValue.maxAge} years`;
  }
}

/** `minAge: 6`: the age calculated from the date of birth must be at least the given number of years */
@Injectable()
export class MinAgeValidator extends FieldValidator {
  static override readonly key = "minAge";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return ageRangeValidator("minAge", config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator("minAge", error);
  }
}

/** `maxAge: 18`: the age calculated from the date of birth must be at most the given number of years */
@Injectable()
export class MaxAgeValidator extends FieldValidator {
  static override readonly key = "maxAge";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return ageRangeValidator("maxAge", config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator("maxAge", error);
  }
}
