import { DateRange } from "@angular/material/datepicker";
import { DateRangeFilterConfigOption } from "app/core/entity-list/EntityListConfig";
import moment from "moment";

export function calculateDateRange(
  dateRangeOption: DateRangeFilterConfigOption,
): DateRange<Date> {
  const startOffsets = dateRangeOption.startOffsets ?? [
    { amount: 0, unit: "days" },
  ];
  const endOffsets = dateRangeOption.endOffsets ?? [
    { amount: 0, unit: "days" },
  ];

  const start = moment();
  const end = moment();

  startOffsets.forEach((offset) => start.add(offset.amount, offset.unit));
  endOffsets.forEach((offset) => end.add(offset.amount, offset.unit));

  start.startOf(startOffsets[0].unit);
  end.endOf(endOffsets[0].unit);

  return new DateRange(start.toDate(), end.toDate());
}

/**
 * Ranges of whole months, quarters and years (the current and the last one),
 * offered e.g. when selecting the period of a report or the dates of a date range field.
 */
export const periodRangeOptions: DateRangeFilterConfigOption[] = [
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],
    label: $localize`:Filter label: Current month`,
  },
  {
    startOffsets: [{ amount: -1, unit: "months" }],
    endOffsets: [{ amount: -1, unit: "months" }],
    label: $localize`:Filter label: Last month`,
  },
  {
    startOffsets: [{ amount: 0, unit: "quarter" }],
    endOffsets: [{ amount: 0, unit: "quarter" }],
    label: $localize`:Filter label: Current quarter`,
  },
  {
    startOffsets: [{ amount: -1, unit: "quarters" }],
    endOffsets: [{ amount: -1, unit: "quarters" }],
    label: $localize`:Filter label: Last quarter`,
  },
  {
    startOffsets: [{ amount: 0, unit: "years" }],
    endOffsets: [{ amount: 0, unit: "years" }],
    label: $localize`:Filter label: Current year`,
  },
  {
    startOffsets: [{ amount: -1, unit: "years" }],
    endOffsets: [{ amount: -1, unit: "years" }],
    label: $localize`:Filter label: Last year`,
  },
];
