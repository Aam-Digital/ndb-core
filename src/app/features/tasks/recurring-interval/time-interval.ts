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

export function generateLabelFromInterval(interval: TimeInterval) {
  // TODO: how to translate units? (probably same problem in date filters ...)
  return (
    " " +
    $localize`:custom interval select option:every ${interval.value} ${interval.unit}`
  );
}
