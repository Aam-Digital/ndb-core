import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { BorderHighlightDirective } from "../../common-components/border-highlight/border-highlight.directive";
import { JsonPipe, NgForOf } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { SelectableFilter } from "../filters/filters";

@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    BorderHighlightDirective,
    NgForOf,
    JsonPipe,
  ],
  standalone: true,
})
export class ListFilterComponent<E extends Entity> {
  @Input({ transform: (value: any) => value as SelectableFilter<E> })
  filterConfig: SelectableFilter<E>;
  @Input() selectedOptions: string[];
  @Output() selectedOptionChange: EventEmitter<string[]> = new EventEmitter();
}
