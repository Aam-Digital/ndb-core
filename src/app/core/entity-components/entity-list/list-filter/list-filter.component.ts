import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterSelection } from "../../../filter/filter-selection/filter-selection";
import { Entity } from "../../../entity/entity";

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

  constructor() {}

  selectOption(selectedOptionKey: string) {
    this.selectedOption = selectedOptionKey;
    this.selectedOptionChange.emit(selectedOptionKey);
  }
}
