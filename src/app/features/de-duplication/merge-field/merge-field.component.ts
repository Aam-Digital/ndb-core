import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { Entity } from "app/core/entity/model/entity";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { CommonModule } from "@angular/common";

import { MergeField } from "../bulk-merge-records/bulk-merge-records.component";

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
  templateUrl: "./merge-field.component.html",
  styleUrls: ["../bulk-merge-records/bulk-merge-records.component.scss"],
})
export class MergeFieldsComponent {
  @Input() field: MergeField;
  @Input() entities: Entity[];
  @Input() existingSelected: boolean[];
  @Input() isDisabled: boolean[];
  @Input() mergedControl: AbstractControl; // Add form control reference
  @Input() fieldEntities: any[]; // Add entities values
  @Output() selectedValue = new EventEmitter<{
    fieldId: string;
    entityIndex: number;
    checked?: boolean;
  }>();

  ngOnInit() {
    this.setInitialFieldState();
  }
  handleCheckboxChange(entityIndex: number, checked: boolean): void {
    this.selectedValue.emit({
      fieldId: this.field.id,
      entityIndex,
      checked,
    });
  }

  handleRadioSelect(entityIndex: number): void {
    this.selectedValue.emit({
      fieldId: this.field.id,
      entityIndex,
    });
  }

  private setInitialFieldState(): void {
    const [valueA, valueB] = this.fieldEntities;
    const initialValue = this.setSmartSelectedValue(
      valueA,
      valueB,
      this.mergedControl.value,
    );
    this.mergedControl.setValue(initialValue);
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
}
