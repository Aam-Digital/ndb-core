import { AbstractControl, ValidatorFn } from "@angular/forms";
import { calculateAge } from "../../../../utils/utils";
import { parseToDate } from "./date-validators";

/**
 * Creates an age range validator (min or max age).
 */
export function createAgeComparisonValidator(
  ageParamValue: unknown,
  comparator: (age: number, param: number) => boolean,
  errorKey: string,
  paramName: "minAge" | "maxAge",
  rangeConfig?: { minAge?: unknown; maxAge?: unknown },
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
 * Validator for minimum age.
 */
export function minAgeValidator(
  minAgeValue: unknown,
  maxAgeValue?: unknown,
): ValidatorFn {
  return createAgeComparisonValidator(
    minAgeValue,
    (age, param) => age >= param,
    "minAge",
    "minAge",
    { minAge: minAgeValue, maxAge: maxAgeValue },
  );
}

/**
 * Validator for maximum age.
 */
export function maxAgeValidator(
  maxAgeValue: unknown,
  minAgeValue?: unknown,
): ValidatorFn {
  return createAgeComparisonValidator(
    maxAgeValue,
    (age, param) => age <= param,
    "maxAge",
    "maxAge",
    { minAge: minAgeValue, maxAge: maxAgeValue },
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
