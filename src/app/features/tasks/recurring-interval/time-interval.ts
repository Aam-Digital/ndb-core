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
  return (
    " " +
    $localize`:custom interval select option:every ${interval.value} ` +
    timeunitLabelMap.get(interval.unit)
  );
}

const timeunitLabelMap: Map<unitOfTime.Base, string> = new Map([
  ["years", $localize`years`],
  ["year", $localize`years`],
  ["y", $localize`years`],
  ["months", $localize`months`],
  ["month", $localize`months`],
  ["m", $localize`months`],
  ["weeks", $localize`weeks`],
  ["week", $localize`weeks`],
  ["w", $localize`weeks`],
  ["days", $localize`days`],
  ["day", $localize`days`],
  ["d", $localize`days`],
]);
