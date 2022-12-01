import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterSelection } from "../filter-selection/filter-selection";
import { Entity } from "../../entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { DateRangeComponent } from "app/core/entity-components/entity-list/date-range/date-range.component";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
})
export class ListFilterComponent<E extends Entity> {
  @Input() filterConfig: FilterSelection<E>;
  @Input() selectedOption: string;
  @Output() selectedOptionChange = new EventEmitter<string>();

  constructor(private dialog: MatDialog) {}

  selectOption(selectedOptionKey: string) {
    this.selectedOption = selectedOptionKey;
    this.selectedOptionChange.emit(selectedOptionKey);
  }

  openDateRangeDialog() {
    this.dialog.open(DateRangeComponent, {
      width: "80%",
      data: {},
    });
  }
}
