import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FilterComponentSettings } from "app/core/entity-components/entity-list/filter-component.settings";
import { DataFilter } from "app/core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "app/core/entity/model/entity";
import moment from "moment";
import {
  DateFilter,
  FilterSelectionOption,
} from "../filter-selection/filter-selection";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { D } from "@angular/cdk/keycodes";
import { Note } from "app/child-dev-project/notes/model/note";
import { Child } from "app/child-dev-project/children/model/child";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterComponent<T extends Entity> {
  fromDate: Date;
  toDate: Date;

  @Output() selectedOptionChange = new EventEmitter<string>();

  @Input() dateRangeFilterConfig: FilterComponentSettings<T>;

  constructor(private dialog: MatDialog) {}

  apply() {
    console.log("Peter apply aufgerufen");
    let option: FilterSelectionOption<T> = {
      key: "custom",
      label: "custom",
      filter: {},
    };
    const filterSettings = this.dateRangeFilterConfig
      .filterSettings as DateFilter<T>;
    filterSettings.filter = this.buildFilter();
    console.log("Peter option", option);
    option.filter = this.buildFilter();
    this.selectedOptionChange.emit("custom");
  }

  buildFilter(): DataFilter<T> {
    return {
      [this.dateRangeFilterConfig.filterConfig.id]: {
        $gte: moment(this.fromDate).format("YYYY-MM-DD"),
        $lte: moment(this.toDate).format("YYYY-MM-DD"),
      },
    } as DataFilter<T>;
  }

  openDialog(e: Event) {
    e.stopPropagation();
    this.dialog
      .open(DateRangeFilterPanelComponent, {
        width: "600px",
        minWidth: "400px",
        data: {
          fromDate: this.fromDate,
          toDate: this.toDate,
          dateRangeFilterConfig: this.dateRangeFilterConfig.filterConfig,
        },
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
