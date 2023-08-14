import { unitOfTime } from "moment";

/**
 * A simple time interval representation for repetitions or offsets.
 */
export class TimeInterval {
  static DATA_TYPE = "time-interval";

  /** amount of the unit to be offset */
  amount: number;

  /** unit (e.g. days, weeks) to be offset */
  unit: unitOfTime.Base;
}

export function generateLabelFromInterval(interval: TimeInterval) {
  return (
    " " +
    $localize`:custom interval select option| e.g. every 2 weeks:every ${
      interval.amount
    } ${timeunitLabelMap.get(interval.unit)}`
  );
}

export const timeUnitsPrimary: { unit: unitOfTime.Base; label: string }[] = [
  { unit: "days", label: $localize`:time unit:days` },
  { unit: "weeks", label: $localize`:time unit:weeks` },
  { unit: "months", label: $localize`:time unit:months` },
  { unit: "years", label: $localize`:time unit:years` },
];

const timeunitLabelMap: Map<unitOfTime.Base, string> = new Map([
  ...timeUnitsPrimary.map(
    (e) => [e.unit, e.label] as [unitOfTime.Base, string],
  ),
  // alternative spellings
  ["year", $localize`:time unit:years`],
  ["y", $localize`:time unit:years`],
  ["month", $localize`:time unit:months`],
  ["m", $localize`:time unit:months`],
  ["week", $localize`:time unit:weeks`],
  ["w", $localize`:time unit:weeks`],
  ["day", $localize`:time unit:days`],
  ["d", $localize`:time unit:days`],
]);
