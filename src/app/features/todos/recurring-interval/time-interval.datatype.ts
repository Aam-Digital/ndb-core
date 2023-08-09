import { DefaultDatatype } from "../../../core/entity/schema/datatype-default";

/**
 * Datatype for defining a time interval.
 */
export class TimeIntervalDatatype extends DefaultDatatype {
  static dataType = "time-interval";

  viewComponent = "DisplayRecurringInterval";
  editComponent = "EditRecurringInterval";
}
