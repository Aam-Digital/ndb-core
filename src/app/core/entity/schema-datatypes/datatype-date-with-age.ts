import { DateOnlyDatatype } from "./datatype-date-only";
import { DateWithAge } from "../../../child-dev-project/children/model/dateWithAge";
import { Injectable } from "@angular/core";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
@Injectable()
export class DateWithAgeDatatype extends DateOnlyDatatype {
  static dataType = "date-with-age";

  editComponent = "EditAge";
  viewComponent = "DisplayDate";

  transformToObjectFormat(value) {
    return new DateWithAge(super.transformToObjectFormat(value));
  }

  transformToDatabaseFormat(value) {
    return super.transformToDatabaseFormat(value);
  }
}
