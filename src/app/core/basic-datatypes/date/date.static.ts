/**
 * Global date format state used throughout the application.
 * These formats are used by both the customDate pipe and Material Datepicker.
 */
import { signal, Signal } from "@angular/core";

// Internal writable signals — not exported to avoid mutable module-level export violations
const _dateFormat = signal("dd.MM.yyyy");
const _dateTimeFormat = signal("dd.MM.yyyy HH:mm");
const _datepickerFormat = signal("DD.MM.YYYY");

/** Current default shortDate format as a readonly signal (Angular DatePipe format, e.g., "dd.MM.yyyy") */
export const defaultDateFormat: Signal<string> = _dateFormat.asReadonly();

/** Current default datetime format as a readonly signal (Angular DatePipe format, e.g., "dd.MM.yyyy HH:mm") */
export const defaultDateTimeFormat: Signal<string> =
  _dateTimeFormat.asReadonly();

/**
 * Current Moment.js format for Material Datepicker as a readonly signal (e.g., "DD.MM.YYYY").
 * We have to use different format for datepicker because Angular DatePipe and Moment.js use different format syntax:
 * e.g. dd.MM.yyyy in DatePipe shows as 22.01.2026, but in Moment.js it would show as Th.01.2026.
 */
export const datepickerFormat: Signal<string> = _datepickerFormat.asReadonly();

/**
 * Set the global date format at runtime based on configuration.
 * This is called by SiteSettingsService during initialization.
 * @param format Angular DatePipe format string (e.g., "dd.MM.yyyy", "MM/dd/yyyy")
 */
export function setGlobalDateFormat(format: string): void {
  if (format) {
    _dateFormat.set(format);
    _dateTimeFormat.set(`${format} HH:mm`);
    _datepickerFormat.set(convertToMomentFormat(format));
  }
}

/**
 * Converts an Angular DatePipe format string to the equivalent Moment.js format string.
 * Angular uses lowercase tokens (dd, yyyy), Moment.js uses uppercase (DD, YYYY).
 * Exported for testing only.
 */
export function convertToMomentFormat(angularFormat: string): string {
  return angularFormat
    .replace(/yyyy/g, "YYYY")
    .replace(/yy/g, "YY")
    .replace(/dd/g, "DD")
    .replace(/d/g, "D");
}
