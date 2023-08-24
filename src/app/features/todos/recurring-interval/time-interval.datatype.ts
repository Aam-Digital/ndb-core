import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";

/**
 * Datatype for defining a time interval.
 */
export class TimeIntervalDatatype extends DefaultDatatype {
  static dataType = "time-interval";

  viewComponent = "DisplayRecurringInterval";
  editComponent = "EditRecurringInterval";
}
