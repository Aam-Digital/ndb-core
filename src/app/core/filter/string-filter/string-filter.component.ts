import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Entity } from "../../entity/model/entity";
import { StringFilter } from "../filters/stringFilter";

/**
 * A simple text input to filter entities by free-text properties
 * (see {@link StringFilter}).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-string-filter",
  templateUrl: "./string-filter.component.html",
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
})
export class StringFilterComponent<E extends Entity> {
  filterConfig = input.required<StringFilter<E>>();

  private readonly destroyRef = inject(DestroyRef);

  textControl = new FormControl("");

  constructor() {
    this.textControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        this.filterConfig().selectedOptionChange.emit(text ? [text] : []);
      });

    effect((onCleanup) => {
      const filterConfig = this.filterConfig();
      this.textControl.setValue(filterConfig.getSearchText(), {
        emitEvent: false,
      });

      // sync back external changes (e.g. "clear all filters")
      const subscription = filterConfig.selectedOptionChange.subscribe(
        (values) => {
          this.textControl.setValue((values ?? []).join(","), {
            emitEvent: false,
          });
        },
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
