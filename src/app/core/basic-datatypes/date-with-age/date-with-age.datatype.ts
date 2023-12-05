import { DateOnlyDatatype } from "../date-only/date-only.datatype";
import { Injectable } from "@angular/core";
import { DateWithAge } from "./dateWithAge";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
@Injectable()
export class DateWithAgeDatatype extends DateOnlyDatatype {
  static override dataType = "date-with-age";
  static override label: string = $localize`:datatype-label:date of birth (date + age)`;

  editComponent = "EditAge";

  transformToObjectFormat(value): DateWithAge {
    return new DateWithAge(super.transformToObjectFormat(value));
  }
}
