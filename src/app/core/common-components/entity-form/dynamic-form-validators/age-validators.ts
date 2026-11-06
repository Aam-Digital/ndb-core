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
 * Creates an age range validator (min or max age).
 * @param rangeConfig both configured ages, only to word the error as a range ("between ... and ...")
 */
export function createAgeComparisonValidator(
  ageParamValue: unknown,
  comparator: (age: number, param: number) => boolean,
  errorKey: string,
  paramName: "minAge" | "maxAge",
  rangeConfig?: AgeRange,
): ValidatorFn {
  const paramNum = Number(ageParamValue);
  if (!Number.isFinite(paramNum)) {
    return () => null;
  }

  const configuredMinAge = Number(rangeConfig?.minAge);
  const configuredMaxAge = Number(rangeConfig?.maxAge);
  const hasMin = Number.isFinite(configuredMinAge);
  const hasMax = Number.isFinite(configuredMaxAge);

  return (control: AbstractControl) => {
    const controlDate = parseToDate(control.value);
    if (!controlDate) {
      return null;
    }

    const age = calculateAge(controlDate);
    if (comparator(age, paramNum)) {
      return null;
    }

    return {
      [errorKey]: {
        [paramName]: paramNum,
        currentAge: age,
        ...(hasMin ? { minAge: configuredMinAge } : {}),
        ...(hasMax ? { maxAge: configuredMaxAge } : {}),
      },
    };
  };
}

/**
 * Validator for the minimum age of the range.
 * The maximum age only words the error as a range, if both are configured.
 */
export function minAgeValidator(ageRange: AgeRange): ValidatorFn {
  return createAgeComparisonValidator(
    ageRange.minAge,
    (age, param) => age >= param,
    "minAge",
    "minAge",
    ageRange,
  );
}

/**
 * Validator for the maximum age of the range.
 * The minimum age only words the error as a range, if both are configured.
 */
export function maxAgeValidator(ageRange: AgeRange): ValidatorFn {
  return createAgeComparisonValidator(
    ageRange.maxAge,
    (age, param) => age <= param,
    "maxAge",
    "maxAge",
    ageRange,
  );
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
  static override key = "minAge";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return minAgeValidator(config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator("minAge", error);
  }
}

/** `maxAge: 18`: the age calculated from the date of birth must be at most the given number of years */
@Injectable()
export class MaxAgeValidator extends FieldValidator {
  static override key = "maxAge";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return maxAgeValidator(config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator("maxAge", error);
  }
}
