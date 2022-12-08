import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import {
  DateRangeFilterConfig,
  FilterConfig,
} from "app/core/entity-components/entity-list/EntityListConfig";
import { FilterComponentSettings } from "app/core/entity-components/entity-list/filter-component.settings";
import { DataFilter } from "app/core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "app/core/entity/model/entity";
import moment from "moment";
import {
  FilterSelection,
  FilterSelectionOption,
} from "../filter-selection/filter-selection";
import { DaterangeHeaderComponent } from "./daterange-header/daterange-header.component";

@Component({
  selector: "app-date-range",
  templateUrl: "./date-range.component.html",
  styleUrls: ["./date-range.component.scss"],
})
export class DateRangeComponent<T extends Entity> {
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  readonly DaterangeHeaderComponent = DaterangeHeaderComponent;
  fromDate: Date;
  toDate: Date;

  @Output() selectedOptionChange = new EventEmitter<string>();

  @Input() dateRangeFilterConfig: FilterComponentSettings<T>;

  apply() {
    let option: FilterSelectionOption<T> =
      this.dateRangeFilterConfig.filterSettings.options.find(
        (option) => option.label === "custom"
      );
    if (!option) {
      option = { key: "custom", label: "custom", filter: {} };
      this.dateRangeFilterConfig.filterSettings.options.push(option);
    }

    option.filter = this.buildFilter();
    this.selectedOptionChange.emit(option.key);
  }

  buildFilter(): DataFilter<Entity> {
    const start = moment(this.fromDate);
    const end = moment(this.toDate);
    const startString = start.format("YYYY-MM-DD");
    const endString = end.format("YYYY-MM-DD");

    return {
      [this.dateRangeFilterConfig.filterConfig.id]: {
        $gte: startString,
        $lte: endString,
      },
    };
  }
}
