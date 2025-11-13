import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicEditComponent } from "app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";

/**
 * Component for managing a single condition within a conditional color section
 */
@Component({
  selector: "app-condition-item",
  templateUrl: "./condition-item.component.html",
  styleUrls: ["./condition-item.component.scss"],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    DynamicEditComponent,
  ],
})
export class ConditionItemComponent {
  @Input() sectionIndex!: number;
  @Input() conditionIndex!: number;
  @Input() condition!: any;
  @Input() colorFieldOptions: SimpleDropdownValue[] = [];
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() formControl?: FormControl;

  @Output() deleteCondition = new EventEmitter<void>();
  @Output() conditionFieldChange = new EventEmitter<string>();

  /**
   * Get the field key from the condition object
   */
  get conditionField(): string {
    return Object.keys(this.condition || {})[0] || "";
  }

  /**
   * Handle field selection change
   */
  onFieldChange(fieldKey: string): void {
    this.conditionFieldChange.emit(fieldKey);
  }

  /**
   * Handle delete condition
   */
  onDeleteCondition(): void {
    this.deleteCondition.emit();
  }
}