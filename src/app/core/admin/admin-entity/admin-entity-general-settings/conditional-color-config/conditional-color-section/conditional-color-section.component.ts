import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl } from "@angular/forms";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ColorInputComponent } from "app/color-input/color-input.component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { ConditionItemComponent } from "../condition-item/condition-item.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

/**
 * Component for managing a single conditional color section
 */
@Component({
  selector: "app-conditional-color-section",
  templateUrl: "./conditional-color-section.component.html",
  styleUrls: ["./conditional-color-section.component.scss"],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    FontAwesomeModule,
    ColorInputComponent,
    ConditionItemComponent,
  ],
})
export class ConditionalColorSectionComponent {
  @Input() sectionIndex!: number;
  @Input() section!: ColorMapping;
  @Input() entityConstructor!: EntityConstructor;
  @Input() colorFieldOptions: SimpleDropdownValue[] = [];
  @Input() conditionFormFieldConfigs = new Map<string, FormFieldConfig>();
  @Input() conditionFormControls = new Map<string, FormControl>();

  @Output() colorChange = new EventEmitter<string>();
  @Output() deleteSection = new EventEmitter<void>();
  @Output() conditionAdded = new EventEmitter<void>();
  @Output() conditionDeleted = new EventEmitter<number>();
  @Output() conditionFieldChanged = new EventEmitter<{ conditionIndex: number; fieldKey: string }>();

  private entitySchemaService = inject(EntitySchemaService);

  /**
   * Get the conditions array for this section
   */
  get conditions(): any[] {
    return (this.section?.condition as any)?.$or || [];
  }

  /**
   * Handle color change for this section
   */
  onColorChange(newColor: string): void {
    this.colorChange.emit(newColor);
  }

  /**
   * Handle delete section
   */
  onDeleteSection(): void {
    this.deleteSection.emit();
  }

  /**
   * Handle add condition to this section
   */
  onAddCondition(): void {
    this.addConditionToSection();
  }

  /**
   * Handle delete condition from this section
   */
  onDeleteCondition(conditionIndex: number): void {
    this.deleteConditionFromSection(conditionIndex);
  }

  /**
   * Handle condition field change
   */
  onConditionFieldChange(conditionIndex: number, fieldKey: string): void {
    this.onConditionFieldChangeInternal(conditionIndex, fieldKey);
  }

  /**
   * Get the field key from a condition object
   */
  getConditionField(condition: any): string {
    return Object.keys(condition || {})[0] || "";
  }

  /**
   * Add a condition to this section
   */
  private addConditionToSection(): void {
    if (!(this.section.condition as any).$or) {
      (this.section.condition as any).$or = [];
    }

    (this.section.condition as any).$or.push({});
    this.conditionAdded.emit();
  }

  /**
   * Delete a condition from this section
   */
  private deleteConditionFromSection(conditionIndex: number): void {
    const conditions = this.conditions;
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    conditions.splice(conditionIndex, 1);

    // Clean up form controls
    const key = `${this.sectionIndex}-${conditionIndex}`;
    this.conditionFormFieldConfigs.delete(key);
    this.conditionFormControls.delete(key);

    this.conditionDeleted.emit(conditionIndex);
  }

  /**
   * Handle condition field change
   */
  private onConditionFieldChangeInternal(conditionIndex: number, fieldKey: string): void {
    const conditions = this.conditions;
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    const condition = conditions[conditionIndex];

    // Clear old condition and set new field
    Object.keys(condition).forEach(key => delete condition[key]);
    condition[fieldKey] = "";

    this.createFormConfigForCondition(conditionIndex, fieldKey);
    this.conditionFieldChanged.emit({ conditionIndex, fieldKey });
  }

  /**
   * Create form configuration for a specific condition
   */
  private createFormConfigForCondition(conditionIndex: number, fieldKey: string): void {
    const key = `${this.sectionIndex}-${conditionIndex}`;
    const fieldConfig = this.entityConstructor.schema.get(fieldKey);
    if (!fieldConfig) return;

    const conditions = this.conditions;
    const condition = conditions[conditionIndex];

    // Create form control
    const formControl = new FormControl(condition[fieldKey] || "");
    this.conditionFormControls.set(key, formControl);

    // Subscribe to value changes
    formControl.valueChanges.subscribe((value) => {
      condition[fieldKey] = value;
    });

    // Create form field config
    this.conditionFormFieldConfigs.set(key, {
      id: fieldKey,
      editComponent: this.entitySchemaService.getComponent(fieldConfig, "edit"),
      dataType: fieldConfig.dataType,
      additional: fieldConfig.additional,
      label: fieldConfig.label || fieldKey,
    } as FormFieldConfig);
  }
}