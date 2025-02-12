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
