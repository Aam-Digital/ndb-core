import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import {
  checkRange,
  isEmptyRange,
  RangeConfig,
  RangeError,
} from "../../common-components/entity-form/dynamic-form-validators/range-config";
import { DateDatatype } from "./date.datatype";

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
export function normalizeDateOnly(value: Date): Date {
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
 * `dateRange: { min: "2020-01-01", max: "$now" }`: the date must be within the given range
 * (either end can be left out; a date, or `"$now"` for today)
 */
@Injectable()
export class DateRangeValidator extends FieldValidator<RangeConfig<unknown>> {
  static override readonly key = "dateRange";
  override readonly datatypesSupported = [DateDatatype];

  override isSwitchedOff(value: RangeConfig<unknown>): boolean {
    return isEmptyRange(value);
  }

  build({ min, max }: RangeConfig<unknown>): ValidatorFn {
    const range = { min: toDateOnly(min), max: toDateOnly(max) };
    return (control) => {
      const value = toDateOnly(control.value);
      const error = value === undefined ? null : checkRange(value, range);
      return error ? { dateRange: error } : null;
    };
  }

  override message({ min, max }: RangeError<Date>): string {
    if (min !== undefined && max !== undefined) {
      return $localize`Date must be between ${formatDateAsDayMonthYear(min)} and ${formatDateAsDayMonthYear(max)}`;
    }
    return min === undefined
      ? $localize`Date must be on or before ${formatDateAsDayMonthYear(max)}`
      : $localize`Date must be on or after ${formatDateAsDayMonthYear(min)}`;
  }
}

function toDateOnly(value: unknown): Date | undefined {
  const date = parseToDate(value);
  return date ? normalizeDateOnly(date) : undefined;
}
