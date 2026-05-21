import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SelectableFilter } from "../filters/filters";
import { MatButtonModule } from "@angular/material/button";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { asArray } from "../../../utils/asArray";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ListFilterComponent<E extends Entity> {
  filterConfig = input.required<SelectableFilter<E>>();

  private readonly destroyRef = inject(DestroyRef);

  selectedValues = linkedSignal({
    source: this.filterConfig,
    computation: (config) => asArray(config.selectedOptionValues),
  });

  autocompleteControl = new FormControl([]);

  constructor() {
    this.autocompleteControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values) => {
        const selectedValues = asArray(values);
        this.selectedValues.set(selectedValues);
        this.filterConfig().selectedOptionChange.emit(selectedValues);
      });

    effect((onCleanup) => {
      const selectedOptionChangeSubscription =
        this.filterConfig().selectedOptionChange.subscribe((values) => {
          this.selectedValues.set(asArray(values));
        });

      onCleanup(() => selectedOptionChangeSubscription.unsubscribe());
    });

    effect(() => {
      this.autocompleteControl.setValue(this.selectedValues(), {
        emitEvent: false,
      });
    });
  }

  getOptionLabel = (option: any) => option.label;
  getOptionValue = (option: any) => option.key;

  selectAll() {
    const allValues = this.filterConfig().options.map((opt) => opt.key);
    this.autocompleteControl.setValue(allValues);
  }

  deselectAll() {
    this.autocompleteControl.setValue([]);
  }
}
