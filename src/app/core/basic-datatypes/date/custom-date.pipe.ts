import { Pipe, PipeTransform, inject, LOCALE_ID } from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  DEFAULT_MEDIUM_DATE_FORMAT,
} from "./date.static";

/**
 * Custom date pipe that extends DatePipe to override shortDate format.
 * Maps "shortDate" and other predefined formats to custom formats.
 */
@Pipe({
  name: "customDate",
  standalone: true,
})
export class CustomDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly datePipe = new DatePipe(this.locale);

  transform(
    value: Date | string | number | null | undefined,
    format?: string,
    timezone?: string,
    locale?: string,
  ): string | null {
    // Override predefined formats with custom formats
    if (format === "shortDate") {
      format = DEFAULT_DATE_FORMAT;
    } else if (format === "short") {
      format = DEFAULT_DATE_TIME_FORMAT;
    } else if (format === "mediumDate") {
      format = DEFAULT_MEDIUM_DATE_FORMAT;
    }

    return this.datePipe.transform(value, format, timezone, locale);
  }
}
