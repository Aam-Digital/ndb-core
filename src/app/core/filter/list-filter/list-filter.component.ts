import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterSelection } from "../filter-selection/filter-selection";
import { Entity } from "../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { BorderHighlightDirective } from "../../common-components/border-highlight/border-highlight.directive";
import { NgForOf } from "@angular/common";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    BorderHighlightDirective,
    NgForOf,
  ],
  standalone: true,
})
export class ListFilterComponent<E extends Entity> {
  @Input() filterConfig: FilterSelection<E>;
  @Input() selectedOption: string;
  @Output() selectedOptionChange = new EventEmitter<string>();

  selectOption(selectedOptionKey: string) {
    this.selectedOption = selectedOptionKey;
    this.selectedOptionChange.emit(selectedOptionKey);
  }
}
