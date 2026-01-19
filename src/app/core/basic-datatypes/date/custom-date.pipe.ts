import { Pipe, PipeTransform, inject, LOCALE_ID } from "@angular/core";
import { DatePipe } from "@angular/common";

/**
 * Custom date pipe that extends DatePipe to override shortDate format.
 * Maps "shortDate" and other predefined formats to custom formats.
 */
@Pipe({
  name: "customDate",
  standalone: true,
})
export class CustomDatePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);
  private datePipe = new DatePipe(this.locale);

  transform(
    value: Date | string | number | null | undefined,
    format?: string,
    timezone?: string,
    locale?: string,
  ): string | null {
    // Override predefined formats
    if (format === "shortDate" || format === "short") {
      format = "dd.MM.yyyy";
    }

    return this.datePipe.transform(value, format, timezone, locale);
  }
}
