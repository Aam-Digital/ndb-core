import { Entity } from "../../entity/model/entity";
import { DateRangeFilterConfigOption } from "../../entity-list/EntityListConfig";
import { DateRange } from "@angular/material/datepicker";
import { DataFilter, Filter } from "./filters";

/**
 * Base class for date filters
 */
export abstract class DateFilterBase<T extends Entity> extends Filter<T> {
  abstract getDateRange(): DateRange<Date>;
  abstract override getFilter(): DataFilter<T>;

  constructor(
    public override name: string,
    public override label: string = name,
    public rangeOptions: DateRangeFilterConfigOption[],
  ) {
    super(name, label);
    this.selectedOptionValues = [];
  }
}
