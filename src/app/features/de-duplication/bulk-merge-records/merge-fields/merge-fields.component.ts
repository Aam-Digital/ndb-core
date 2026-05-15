import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import {
  Component,
  input,
  computed,
  effect,
  untracked,
  ChangeDetectionStrategy,
} from "@angular/core";
import { toSignal, toObservable } from "@angular/core/rxjs-interop";
import { switchMap, startWith } from "rxjs";
import { AbstractControl } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { Entity } from "app/core/entity/model/entity";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-merge-fields",
  imports: [MatCheckboxModule, MatRadioModule, EntityFieldViewComponent],
  templateUrl: "./merge-fields.component.html",
  styleUrls: ["./merge-fields.component.scss"],
})
export class MergeFieldsComponent {
  field = input.required<FormFieldConfig>();
  entities = input.required<Entity[]>();
  control = input.required<AbstractControl>();

  allowsMultiValue = computed(() => this.allowsMultiValueMerge());

  isDisabled = computed(() =>
    this.entities().map((entity) => !this.hasValue(entity[this.field().id])),
  );

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(
      switchMap((ctrl) => ctrl.valueChanges.pipe(startWith(ctrl.value))),
    ),
  );

  existingSelected = computed(() =>
    this.entities().map((entity, i) =>
      this.isDisabled()[i]
        ? false
        : this.isValueSelected(this.controlValue(), entity[this.field().id]),
    ),
  );

  constructor() {
    effect(() => {
      const entities = this.entities();
      const field = this.field();
      const ctrl = this.control();
      if (!entities?.length) return;
      const [valueA, valueB] = entities.map((e) => e[field.id]);
      const smartValue = this.setSmartSelectedValue(valueA, valueB, ctrl.value);
      untracked(() => ctrl.setValue(smartValue));
    });
  }

  /**
   * Determines the best value to use when merging two entity field values.
   * If both values are identical, it returns one of them.
   * If one value is empty while the other is not, it returns the non-empty value.
   * Otherwise, it retains the current form value.
   */
  private setSmartSelectedValue(
    valueA: any,
    valueB: any,
    currentValue: any,
  ): any {
    if (this.areValuesIdentical(valueA, valueB)) {
      return valueA;
    } else if (!this.hasValue(valueA) && this.hasValue(valueB)) {
      return valueB;
    } else if (!this.hasValue(valueB) && this.hasValue(valueA)) {
      return valueA;
    } else if (Array.isArray(valueA) || Array.isArray(valueB)) {
      return [
        ...(Array.isArray(valueA) ? valueA : []),
        ...(Array.isArray(valueB) ? valueB : []),
      ];
    }
    return currentValue;
  }

  private isValueSelected(currentValue: any, entityValue: any): boolean {
    if (this.field().isArray) {
      return entityValue?.every((e: any) =>
        currentValue?.some((c: any) => JSON.stringify(c) === JSON.stringify(e)),
      );
    } else if (this.allowsMultiValue()) {
      return (currentValue ?? "").includes(entityValue);
    } else {
      return JSON.stringify(currentValue) === JSON.stringify(entityValue);
    }
  }

  private areValuesIdentical(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private hasValue(value: any): boolean {
    return !!value || (Array.isArray(value) && value.length > 0);
  }

  private allowsMultiValueMerge(): boolean {
    return (
      this.field()?.dataType === "string" ||
      this.field()?.dataType === "long-text" ||
      this.field()?.isArray
    );
  }

  /*
   * Selects the value of the entity at the given index.
   * If the field is an array, the selected value is added to the existing value.
   * If the field allows multi-value merge, the selected value is appended to the existing value.
   */
  selectExistingValue(entityIndex: number, checked?: boolean): void {
    const selectedValue = this.entities()[entityIndex][this.field().id];
    let newValue = selectedValue;
    if (this.field().isArray) {
      newValue = this.getMergedArrayValue(
        this.control().value,
        selectedValue,
        checked,
      );
    } else if (this.allowsMultiValue()) {
      newValue = this.getMergedStringValue(
        this.control().value,
        selectedValue,
        checked,
      );
    }

    this.control().setValue(newValue);
  }

  private getMergedArrayValue(
    value: any[],
    selectedValue: any[],
    checked: boolean,
  ): any[] {
    value = value ?? [];
    if (checked) {
      value = value.concat(selectedValue);
    } else {
      value = value.filter((v) => !selectedValue.includes(v));
    }
    return value;
  }

  private getMergedStringValue(
    value: string,
    selectedValue: string,
    checked: boolean,
  ): string {
    if (checked) {
      value = (value?.length > 0 ? value + ", " : "") + selectedValue;
    } else {
      value = value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== selectedValue)
        .join(", ");
    }
    return value;
  }
}
