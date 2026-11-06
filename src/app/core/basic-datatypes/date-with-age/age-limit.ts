import { AbstractControl, ValidatorFn } from "@angular/forms";
import { calculateAge } from "../../../utils/utils";
import { parseToDate } from "../date/date-limit";

/** the minimum and maximum age configured for a field (either can be missing) */
export interface AgeRange {
  minAge?: unknown;
  maxAge?: unknown;
}

/**
 * Creates the validator for one end of the configured age range.
 * The error also carries the other end, if configured, to word it as a range ("between ... and ...").
 */
export function ageRangeValidator(
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
