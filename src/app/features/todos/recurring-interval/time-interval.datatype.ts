import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";

/**
 * Datatype for defining a time interval.
 */
export class TimeIntervalDatatype extends DefaultDatatype {
  static override dataType = "time-interval";
  static override label: string = $localize`:datatype-label:time interval`;

  viewComponent = "DisplayRecurringInterval";
  editComponent = "EditRecurringInterval";
}
