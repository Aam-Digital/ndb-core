import { Entity } from "../../entity/model/entity";
import { DateRangeFilterConfigOption } from "../../entity-list/EntityListConfig";
import { DateRange } from "@angular/material/datepicker";
import { calculateDateRange } from "../../basic-datatypes/date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import moment from "moment";
import { DataFilter, Filter } from "./filters";
import { isValidDate } from "../../../utils/utils";

/**
 * Represents a filter for date values.
 * The filter can either be one of the predefined options or two manually entered dates.
 */
export class DateFilter<T extends Entity> extends Filter<T> {
  constructor(
    public name: string,
    public label: string = name,
    public rangeOptions: DateRangeFilterConfigOption[],
  ) {
    super(name, label);
    this.selectedOptionValues = [];
  }

  /**
   * Returns the date range according to the selected option or dates
   */
  getDateRange(): DateRange<Date> {
    const selectedOption = this.getSelectedOption();
    if (selectedOption) {
      return calculateDateRange(selectedOption);
    }
    const dates = this.selectedOptionValues;
    if (dates?.length == 2) {
      return this.getDateRangeFromDateStrings(dates[0], dates[1]);
    }
    return new DateRange(undefined, undefined);
  }

  getFilter(): DataFilter<T> {
    const range = this.getDateRange();
    const filterObject: { $gte?: string; $lte?: string } = {};
    if (range.start) {
      filterObject.$gte = moment(range.start).format("YYYY-MM-DD");
    }
    if (range.end) {
      filterObject.$lte = moment(range.end).format("YYYY-MM-DD");
    }
    if (filterObject.$gte || filterObject.$lte) {
      return {
        [this.name]: filterObject,
      } as DataFilter<T>;
    }
    return {} as DataFilter<T>;
  }

  getSelectedOption() {
    return this.rangeOptions[this.selectedOptionValues as any];
  }

  private getDateRangeFromDateStrings(
    dateStr1: string,
    dateStr2: string,
  ): DateRange<Date> {
    const date1 = moment(dateStr1).toDate();
    const date2 = moment(dateStr2).toDate();

    return new DateRange(
      isValidDate(date1) ? date1 : undefined,
      isValidDate(date2) ? date2 : undefined,
    );
  }
}
