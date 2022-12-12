import { unitOfTime } from "moment";

/**
 * A simple time interval representation for repetitions or offsets.
 */
export class TimeInterval {
  static DATA_TYPE = "time-interval";

  /** amount of the unit to be offset */
  value: number;

  /** unit (e.g. days, weeks) to be offset */
  unit: unitOfTime.Base;
}
