import {
  MAT_NATIVE_DATE_FORMATS,
  MatDateFormats,
  NativeDateAdapter,
} from "@angular/material/core";
import moment from "moment";
import { Injectable } from "@angular/core";
import { getLocaleFirstDayOfWeek } from "@angular/common";

/**
 * Extend MAT_NATIVE_DATE_FORMATS to also support parsing.
 */
export const DATE_FORMATS: MatDateFormats = {
  // in addition to the customDate pipe
  // we need to add dateInput and override the method because we are not using DatePipe here, we are using moment.js
  // and all date picker inputs are using moment.js, and this will ensure that dates are always displayed in our default format.
  parse: { dateInput: "DD.MM.YYYY" },
  display: {
    ...MAT_NATIVE_DATE_FORMATS.display,
    dateInput: "DD.MM.YYYY",
  },
};

@Injectable()
export class DateAdapterWithFormatting extends NativeDateAdapter {
  /**
   * Using Moment.js to parse the date input {@link https://momentjs.com/guides/#/parsing/}
   * @param value
   * @param parseFormat
   */
  override parse(value: any, parseFormat?: any): Date | null {
    if (value && typeof value == "string") {
      return moment(value, parseFormat, this.locale, true).toDate();
    }
    return value ? moment(value, true).locale(this.locale).toDate() : null;
  }

  override getFirstDayOfWeek(): number {
    return getLocaleFirstDayOfWeek(this.locale);
  }

  override format(date: Date, displayFormat: any): string {
    if (typeof displayFormat === "string") {
      return moment(date).locale(this.locale).format(displayFormat);
    }
    return super.format(date, displayFormat);
  }
}
