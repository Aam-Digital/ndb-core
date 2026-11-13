import { AbstractControl, ValidatorFn } from "@angular/forms";

/**
 * Parses a value to a Date object.
 * Handles Date objects, date strings (YYYY-MM-DD), timestamps, and special value "$now".
 */
export function parseToDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    if (value === "$now") {
      return new Date();
    }

    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateMatch = dateRegex.exec(value);
    if (dateMatch) {
      const localDate = new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
      );
      if (!Number.isNaN(localDate.getTime())) {
        return localDate;
      }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

/**
 * Normalizes a date to just the date portion (no time).
 */
function normalizeDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function formatDateAsDayMonthYear(value: Date): string {
  return `${value.getDate().toString().padStart(2, "0")}.${(
    value.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${value.getFullYear()}`;
}

/**
 * Creates a date range validator (min or max).
 */
export function createDateComparisonValidator(
  dateParamValue: unknown,
  comparator: (controlDate: Date, paramDate: Date) => boolean,
  errorKey: string,
  paramName: "minDate" | "maxDate",
): ValidatorFn {
  const parsedParam = parseToDate(dateParamValue);
  if (!parsedParam) {
    return () => null;
  }

  const paramDate = normalizeDateOnly(parsedParam);
  return (control: AbstractControl) => {
    const controlDate = parseToDate(control.value);
    if (!controlDate) {
      return null;
    }

    const normalizedControlDate = normalizeDateOnly(controlDate);
    if (comparator(normalizedControlDate, paramDate)) {
      return null;
    }

    return {
      [errorKey]: {
        [paramName]: paramDate,
        currentDate: normalizedControlDate,
      },
    };
  };
}

/**
 * Validator for minimum date.
 */
export function minDateValidator(minDateValue: unknown): ValidatorFn {
  return createDateComparisonValidator(
    minDateValue,
    (control, param) => control >= param,
    "minDate",
    "minDate",
  );
}

/**
 * Validator for maximum date.
 */
export function maxDateValidator(maxDateValue: unknown): ValidatorFn {
  return createDateComparisonValidator(
    maxDateValue,
    (control, param) => control <= param,
    "maxDate",
    "maxDate",
  );
}

export function descriptionForDateValidator(
  validator: "minDate" | "maxDate",
  validationValue: any,
): string {
  switch (validator) {
    case "minDate":
      return $localize`Date must be on or after ${formatDateAsDayMonthYear(validationValue.minDate)}`;
    case "maxDate":
      return $localize`Date must be on or before ${formatDateAsDayMonthYear(validationValue.maxDate)}`;
  }
}
