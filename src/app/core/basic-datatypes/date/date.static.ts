/**
 * Global date format constants used throughout the application.
 * These formats are used by both the customDate pipe and Material Datepicker.
 */

/** Default shortDate format for display (e.g., 22.01.2026) - Angular DatePipe format */
export let DEFAULT_DATE_FORMAT = "dd.MM.yyyy";

/** Default short format for display with time (e.g., 22.01.2026 14:30) - Angular DatePipe format */
export let DEFAULT_DATE_TIME_FORMAT = "dd.MM.yyyy HH:mm";

/** moment.js format for Material Datepicker (e.g., 22.01.2026)
 * we have to use different format for datepicker because Angular DatePipe and Moment.js use different format syntax
 * for eg dd.MM.yyyy in Datepipe will show as 22.01.2026 but in Moment.js it will show as Th.01.2026
 * hence we have to use DD.MM.YYYY for Moment.js
 */

export const DATEPICKER_FORMAT = "DD.MM.YYYY";

/**
 * Set the global date format at runtime based on configuration.
 * This is called by SiteSettingsService during initialization.
 * @param format Angular DatePipe format string (e.g., "dd.MM.yyyy", "MM/dd/yyyy")
 */
export function setGlobalDateFormat(format: string): void {
  if (format) {
    DEFAULT_DATE_FORMAT = format;
    // Update date-time format to include the custom date format with time
    DEFAULT_DATE_TIME_FORMAT = `${format} HH:mm`;
  }
}
