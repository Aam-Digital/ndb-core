import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SelectableFilter } from "../filters/filters";
import { MatButtonModule } from "@angular/material/button";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { asArray } from "../../../utils/asArray";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-list-filter",
  templateUrl: "./list-filter.component.html",
  styleUrls: ["./list-filter.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    BasicAutocompleteComponent,
  ],
})
export class ListFilterComponent<E extends Entity>
  implements OnChanges, OnInit
{
  @Input({ transform: (value: any) => value as SelectableFilter<E> })
  filterConfig: SelectableFilter<E>;

  autocompleteControl = new FormControl([]);

  ngOnInit() {
    this.autocompleteControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((values) => {
        this.filterConfig.selectedOptionChange.emit(asArray(values));
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.filterConfig) {
      this.autocompleteControl.setValue(this.filterConfig.selectedOptionValues);

      this.filterConfig.selectedOptionChange
        .pipe(untilDestroyed(this))
        .subscribe((values) => {
          this.autocompleteControl.setValue(asArray(values), {
            emitEvent: false,
          });
        });
    }
  }

  getOptionLabel = (option: any) => option.label;
  getOptionValue = (option: any) => option.key;

  selectAll() {
    const allValues = this.filterConfig.options.map((opt) => opt.key);
    this.autocompleteControl.setValue(allValues);
  }

  deselectAll() {
    this.autocompleteControl.setValue([]);
  }
}
