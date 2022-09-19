import { NativeDateAdapter } from "@angular/material/core";
import moment from "moment";

export class DateAdapterWithFormatting extends NativeDateAdapter {
  /**
   * Using Moment.js to parse the date input {@link https://momentjs.com/guides/#/parsing/}
   * @param value
   * @param parseFormat
   */
  parse(value: any, parseFormat?: any): Date | null {
    if (value && typeof value == "string") {
      return moment(value, parseFormat, this.locale, true).toDate();
    }
    return value ? moment(value, true).locale(this.locale).toDate() : null;
  }
}
