import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterSelection } from "../../../filter/filter-selection/filter-selection";
import { Entity } from "../../../entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { ChangelogComponent } from "app/core/latest-changes/changelog/changelog.component";
import { DateRangeComponent } from "../date-range/date-range.component";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
  styleUrls: ["./list-filter.component.scss"],
})
export class ListFilterComponent<E extends Entity> {
  @Input() displayAsToggle: boolean;
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
