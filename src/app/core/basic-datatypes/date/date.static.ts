/**
 * Global date format constants used throughout the application.
 * These formats are used by both the customDate pipe and Material Datepicker.
 */

/** Default shortDate format for display (e.g., 22.01.2026) - Angular DatePipe format */
export const DEFAULT_DATE_FORMAT = "dd.MM.yyyy";

/** Default short format for display with time (e.g., 22.01.2026 14:30) - Angular DatePipe format */
export const DEFAULT_DATE_TIME_FORMAT = "dd.MM.yyyy HH:mm";

/** Default medium date format for birthdays and special dates (e.g., Mon, 24. Dec) - Angular DatePipe format */
export const DEFAULT_MEDIUM_DATE_FORMAT = "E, dd. MMM";

/** moment.js format for Material Datepicker (e.g., 22.01.2026)
 * we have to use different format for datepicker because Angular DatePipe and Moment.js use different format syntax
 * for eg dd.MM.yyyy in Datepipe will show as 22.01.2026 but in Moment.js it will show as Th.01.2026
 * hence we have to use DD.MM.YYYY for Moment.js
 */

export const DATEPICKER_FORMAT = "DD.MM.YYYY";
