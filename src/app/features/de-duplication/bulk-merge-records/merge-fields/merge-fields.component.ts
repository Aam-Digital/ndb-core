import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { Entity } from "app/core/entity/model/entity";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { CommonModule } from "@angular/common";
import { MergeField } from "../bulk-merge-records.component";

@Component({
  selector: "app-merge-fields",
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatRadioModule,
    EntityFieldViewComponent,
    EntityFieldEditComponent,
  ],
  templateUrl: "./merge-fields.component.html",
  styleUrls: ["./merge-fields.component.scss"],
})
export class MergeFieldsComponent implements OnInit {
  @Input() field!: MergeField;
  @Input() entities!: Entity[];
  @Input() existingSelected!: boolean[];
  @Input() isDisabled!: boolean[];
  @Input() control!: AbstractControl;
  @Output() valueChanged = new EventEmitter<any>();

  ngOnInit() {
    this.setInitialFieldState();
  }

  private setInitialFieldState(): void {
    if (this.entities) {
      const [valueA, valueB] = this.entities?.map((e) => e[this.field.id]);
      const initialValue = this.setSmartSelectedValue(
        valueA,
        valueB,
        this.control.value,
      );
      this.control.setValue(initialValue);
    }
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

  private areValuesIdentical(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private hasValue(value: any): boolean {
    return !!value || (Array.isArray(value) && value.length > 0);
  }

  /*
   * Selects the value of the entity at the given index.
   * If the field is an array, the selected value is added to the existing value.
   * If the field allows multi-value merge, the selected value is appended to the existing value.
   */
  selectExistingValue(entityIndex: number, checked?: boolean): void {
    const selectedValue = this.entities[entityIndex][this.field.id];
    let newValue = selectedValue;
    if (this.field.isArray) {
      newValue = this.getMergedArrayValue(
        this.control.value,
        selectedValue,
        checked,
      );
    } else if (this.field.allowsMultiValueMerge) {
      newValue = this.getMergedStringValue(
        this.control.value,
        selectedValue,
        checked,
      );
    }

    this.valueChanged.emit(newValue);
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
