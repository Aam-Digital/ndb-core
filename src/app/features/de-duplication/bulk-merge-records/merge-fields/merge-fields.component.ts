import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { Entity } from "app/core/entity/model/entity";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { CommonModule } from "@angular/common";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

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
  @Input() field!: FormFieldConfig;
  @Input() entities!: Entity[];
  @Input() control!: AbstractControl;
  @Output() valueChanged = new EventEmitter<any>();

  existingSelected: boolean[] = [];
  isDisabled: boolean[] = [];
  allowsMultiValue: boolean = false;

  ngOnInit() {
    this.initializeFieldState();

    this.control.valueChanges.subscribe((newValue) => {
      this.updateSelectedStatus(newValue);
      const control = this.control.get(this.field.id);
      if (control) {
        control.patchValue(newValue);
      }
    });
  }

  private initializeFieldState(): void {
    if (!this.entities?.length) return;

    const [valueA, valueB] = this.entities.map((e) => e[this.field.id]);
    this.control.setValue(
      this.setSmartSelectedValue(valueA, valueB, this.control.value),
    );
    this.allowsMultiValue = this.allowsMultiValueMerge();
    this.isDisabled = this.entities.map(
      (entity) => !this.hasValue(entity[this.field.id]),
    );
    this.updateSelectedStatus(this.control.value);
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

  private updateSelectedStatus(currentValue: any): void {
    this.existingSelected = this.entities.map((entity, i) =>
      this.isDisabled[i]
        ? false
        : this.isValueSelected(currentValue, entity[this.field.id]),
    );
  }

  private isValueSelected(currentValue: any, entityValue: any): boolean {
    if (this.field.isArray) {
      return entityValue?.every((e: any) =>
        currentValue?.some((c: any) => JSON.stringify(c) === JSON.stringify(e)),
      );
    } else if (this.allowsMultiValue) {
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
      this.field?.dataType === "string" ||
      this.field?.dataType === "long-text" ||
      this.field?.isArray
    );
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
    } else if (this.allowsMultiValue) {
      newValue = this.getMergedStringValue(
        this.control.value,
        selectedValue,
        checked,
      );
    }

    this.control.setValue(newValue);
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
