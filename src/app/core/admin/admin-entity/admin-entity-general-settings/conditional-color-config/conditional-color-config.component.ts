import {
  Component,
  inject,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from "@angular/core";
import {
  MatFormFieldModule,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ColorInputComponent } from "app/color-input/color-input.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicEditComponent } from "app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";

/**
 * A form control for configuring conditional colors based on entity fields.
 */
@Component({
  selector: "app-conditional-color-config",
  templateUrl: "./conditional-color-config.component.html",
  styleUrls: ["./conditional-color-config.component.scss"],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: ConditionalColorConfigComponent,
    },
  ],
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    ColorInputComponent,
    DynamicEditComponent,
  ],
})
export class ConditionalColorConfigComponent
  extends CustomFormControlDirective<string | ColorMapping[]>
  implements OnInit
{
  @Input() entityConstructor: EntityConstructor;
  @Input() isConditionalMode: boolean = false;
  @Output() isConditionalModeChange = new EventEmitter<boolean>();

  private entitySchemaService = inject(EntitySchemaService);

  colorFieldOptions: SimpleDropdownValue[] = [];
  conditionFormFieldConfigs: Map<number, FormFieldConfig> = new Map();
  conditionFormControls: Map<number, FormControl> = new Map();

  addConditionalMode(): void {
    this.isConditionalModeChange.emit(true);
  }

  removeConditionalMode(): void {
    this.isConditionalModeChange.emit(false);
  }

  ngOnInit(): void {
    this.initColorFieldOptions();
    this.initializeFormControls();
  }

  /**
   * Initialize form controls for existing conditions
   */
  private initializeFormControls(): void {
    const conditionalMappings = this.getConditionalMappings();
    conditionalMappings.forEach((mapping, index) => {
      const fieldKey = this.getConditionField(mapping);
      if (fieldKey) {
        this.createFormConfigForMapping(mapping, index, fieldKey);
      }
    });
  }

  /**
   * Get the field key from a condition mapping
   */
  getConditionField(mapping: ColorMapping): string | null {
    if (!mapping?.condition || typeof mapping.condition !== "object") {
      return null;
    }
    const keys = Object.keys(mapping.condition);
    return keys.length > 0 ? keys[0] : null;
  }

  /**
   * Handle condition field selection change
   */
  onConditionFieldChange(index: number, fieldKey: string): void {
    const currentMappings = this.getConditionalMappings();
    if (index < 0 || index >= currentMappings.length) {
      return;
    }

    // Update the condition to use the new field
    const newCondition = { [fieldKey]: "" };
    currentMappings[index] = {
      ...currentMappings[index],
      condition: newCondition,
    };

    this.onConditionalMappingsChange([...currentMappings]);

    // Recreate form config for this rule with the new field (deferred to avoid change detection error)
    setTimeout(() => {
      this.createFormConfigForMapping(currentMappings[index], index, fieldKey);
    });
  }

  /**
   * Initialize dropdown options for fields that can be used for conditional colors.
   */
  private initColorFieldOptions(): void {
    if (!this.entityConstructor?.schema) {
      return;
    }

    this.colorFieldOptions = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, field]) => field.label)
      .map(([key, field]) => ({ value: key, label: field.label }));
  }

  /**
   * Get the static/default color from the value
   */
  getStaticColor(): string {
    if (typeof this.value === "string") {
      return this.value;
    }

    if (Array.isArray(this.value)) {
      const fallback = this.value.find(
        (mapping) =>
          mapping.condition && Object.keys(mapping.condition).length === 0,
      );
      return fallback?.color || "";
    }

    return "";
  }

  /**
   * Update the static/default color
   */
  onStaticColorChange(newColor: string): void {
    if (typeof this.value === "string" || !Array.isArray(this.value)) {
      this.value = newColor;
      this.onChange(newColor);
      return;
    }

    const conditionalMappings = this.getConditionalMappings();

    if (newColor) {
      conditionalMappings.push({
        condition: {},
        color: newColor,
      });
    }

    this.value = conditionalMappings;
    this.onChange(conditionalMappings);
  }

  /**
   * Get the conditional color (shared by all conditions)
   */
  getConditionalColor(): string {
    if (!Array.isArray(this.value)) {
      return "";
    }

    // Get color from the first conditional mapping (they all share the same color)
    const firstMapping = this.value.find(
      (mapping) =>
        mapping.condition && Object.keys(mapping.condition).length > 0,
    );
    return firstMapping?.color || "";
  }

  /**
   * Update the conditional color (applies to all conditions)
   */
  onConditionalColorChange(newColor: string): void {
    if (!Array.isArray(this.value)) {
      return;
    }

    const updatedMappings = this.value.map((mapping) => {
      // Update color for all conditional mappings (those with conditions)
      if (mapping.condition && Object.keys(mapping.condition).length > 0) {
        return { ...mapping, color: newColor };
      }
      // Keep fallback color unchanged
      return mapping;
    });

    this.value = updatedMappings;
    this.onChange(updatedMappings);
  }

  /**
   * Get conditional mappings (only those with fields selected)
   */
  getConditionalMappings(): ColorMapping[] {
    if (!Array.isArray(this.value)) {
      return [];
    }

    // Only include mappings that have at least one field in the condition
    return this.value.filter(
      (mapping) =>
        mapping.condition &&
        typeof mapping.condition === "object" &&
        Object.keys(mapping.condition).length > 0,
    );
  }

  /**
   * Update conditional mappings (preserves fallback color if present)
   */
  onConditionalMappingsChange(newMappings: ColorMapping[]): void {
    if (!newMappings || !Array.isArray(newMappings)) {
      return;
    }

    const staticColor = this.getStaticColor();
    const allMappings = [...newMappings];

    if (staticColor) {
      allMappings.push({
        condition: {},
        color: staticColor,
      });
    }

    this.value = allMappings;
    this.onChange(allMappings);
  }

  /**
   * Add a new color mapping rule - uses shared conditional color
   */
  addNewRule(): void {
    const currentMappings = this.getConditionalMappings();

    // Create a new rule with the first available field selected
    const defaultField = this.colorFieldOptions[0]?.value || "";

    if (!defaultField) {
      // No fields available, can't add a condition
      return;
    }

    // Use the shared conditional color
    const conditionalColor = this.getConditionalColor();

    const newMapping: ColorMapping = {
      condition: { [defaultField]: "" },
      color: conditionalColor,
    };

    const newIndex = currentMappings.length;
    this.onConditionalMappingsChange([...currentMappings, newMapping]);

    // Create form config for the new rule
    setTimeout(() => {
      this.createFormConfigForMapping(newMapping, newIndex, defaultField);
    });
  }

  /**
   * Update the condition of a specific mapping
   */
  updateRuleCondition(index: number, newCondition: any): void {
    if (!newCondition) {
      return;
    }

    const currentMappings = this.getConditionalMappings();
    if (index < 0 || index >= currentMappings.length) {
      return;
    }

    currentMappings[index] = {
      ...currentMappings[index],
      condition: newCondition,
    };

    this.onConditionalMappingsChange([...currentMappings]);
  }

  /**
   * Update the color of a specific mapping
   */
  updateRuleColor(index: number, newColor: string): void {
    const currentMappings = this.getConditionalMappings();
    if (index < 0 || index >= currentMappings.length) {
      return;
    }

    currentMappings[index] = {
      ...currentMappings[index],
      color: newColor,
    };

    this.onConditionalMappingsChange([...currentMappings]);
  }

  /**
   * Delete a specific mapping
   */
  deleteRule(index: number): void {
    const currentMappings = this.getConditionalMappings();
    if (index < 0 || index >= currentMappings.length) {
      return;
    }

    currentMappings.splice(index, 1);
    this.conditionFormFieldConfigs.delete(index);
    this.conditionFormControls.delete(index);
    this.onConditionalMappingsChange([...currentMappings]);
  }

  /**
   * Create FormFieldConfig for a condition based on the selected field's schema
   */
  private createFormConfigForMapping(
    mapping: ColorMapping,
    index: number,
    fieldKey: string,
  ): void {
    if (!fieldKey) {
      return;
    }

    const fieldSchema = this.entityConstructor?.schema?.get(fieldKey);
    if (!fieldSchema) {
      return;
    }

    // Get the current value from the condition
    const currentValue = mapping.condition?.[fieldKey];

    // Always recreate FormControl when field changes to ensure subscription uses correct fieldKey
    const formControl = new FormControl(currentValue);
    this.conditionFormControls.set(index, formControl);

    // Subscribe to value changes to update the condition (deferred to avoid change detection error)
    formControl.valueChanges.subscribe((value) => {
      setTimeout(() => {
        // Get the current field key from the mapping to ensure we're using the latest
        const currentMappings = this.getConditionalMappings();
        const currentMapping = currentMappings[index];
        if (!currentMapping) return;

        const currentFieldKey = this.getConditionField(currentMapping);
        if (!currentFieldKey) return;

        const updatedCondition = { [currentFieldKey]: value };
        this.updateRuleCondition(index, updatedCondition);
      });
    });

    // Build the FormFieldConfig
    const formFieldConfig: FormFieldConfig = {
      id: fieldKey,
      editComponent: this.entitySchemaService.getComponent(fieldSchema, "edit"),
      dataType: fieldSchema.dataType,
      additional: fieldSchema.additional,
      label: fieldSchema.label || fieldKey,
    };

    this.conditionFormFieldConfigs.set(index, formFieldConfig);
  }

  /**
   * Open full JSON editor for all conditions
   */
  openFullJsonEditor(): void {
    // This would open a dialog with the full ColorMapping[] array
    // For now, we can use the existing json-editor-button on each rule
    console.log("Full JSON editor not yet implemented");
  }

  /**
   * Get FormFieldConfig for a specific rule index
   */
  getFormFieldConfigForIndex(index: number): FormFieldConfig {
    return this.conditionFormFieldConfigs.get(index);
  }

  /**
   * Get FormControl for a specific rule index
   */
  getFormControlForIndex(index: number): FormControl {
    return this.conditionFormControls.get(index);
  }
}
