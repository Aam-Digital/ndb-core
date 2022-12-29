import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { FilterComponentSettings } from "app/core/entity-components/entity-list/filter-component.settings";
import { DataFilter } from "app/core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "app/core/entity/model/entity";
import moment from "moment";
import { FilterSelectionOption } from "../filter-selection/filter-selection";
import { DaterangeHeaderComponent } from "./daterange-header/daterange-header.component";
import { DaterangePanelComponent } from "./daterange-panel/daterange-panel.component";

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

  constructor(private dialog: MatDialog) {}

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

  openDialog() {
    this.dialog
      .open(DaterangePanelComponent, {
        width: "40%",
        height: "40%",
        data: { fromDate: this.fromDate, toDate: this.toDate },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.fromDate = res.start;
          this.toDate = res.end;
          this.apply();
        }
      });
  }
}
