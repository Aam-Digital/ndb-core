import { Component, Input } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { BorderHighlightDirective } from "../../common-components/border-highlight/border-highlight.directive";
import { JsonPipe, NgForOf } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { SelectableFilter } from "../filters/filters";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
  styleUrls: ["./list-filter.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    BorderHighlightDirective,
    NgForOf,
    JsonPipe,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  standalone: true,
})
export class ListFilterComponent<E extends Entity> {
  @Input({ transform: (value: any) => value as SelectableFilter<E> })
  filterConfig: SelectableFilter<E>;

  selectAll() {
    this.filterConfig.selectedOptionValues = this.filterConfig.options.map(
      (option) => option.key,
    );
    this.filterConfig.selectedOptionChange.emit(
      this.filterConfig.selectedOptionValues,
    );
  }

  deselectAll() {
    this.filterConfig.selectedOptionValues = [];
    this.filterConfig.selectedOptionChange.emit(
      this.filterConfig.selectedOptionValues,
    );
  }
}
