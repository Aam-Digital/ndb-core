import { DateOnlyDatatype } from "../date-only/date-only.datatype";
import { DateWithAge } from "../../../child-dev-project/children/model/dateWithAge";
import { Injectable } from "@angular/core";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
@Injectable()
export class DateWithAgeDatatype extends DateOnlyDatatype {
  static dataType = "date-with-age";
  editComponent = "EditAge";

  transformToObjectFormat(value): DateWithAge {
    return new DateWithAge(super.transformToObjectFormat(value));
  }
}
