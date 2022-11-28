import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterSelection } from "../filter-selection/filter-selection";
import { Entity } from "../../entity/model/entity";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
})
export class ListFilterComponent<E extends Entity> {
  @Input() displayAsToggle: boolean;
  @Input() filterConfig: FilterSelection<E>;
  @Input() selectedOption: string;
  @Output() selectedOptionChange = new EventEmitter<string>();

  selectOption(selectedOptionKey: string) {
    this.selectedOption = selectedOptionKey;
    this.selectedOptionChange.emit(selectedOptionKey);
  }
}
