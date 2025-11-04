import { Component, Input, OnInit } from "@angular/core";
import {
  MatFormFieldModule,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ColorInputComponent } from "app/color-input/color-input.component";
import { JsonEditorButtonComponent } from "app/core/common-components/json-editor-button/json-editor-button.component";

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
    JsonEditorButtonComponent,
  ],
})
export class ConditionalColorConfigComponent
  extends CustomFormControlDirective<string | ColorMapping[]>
  implements OnInit
{
  @Input() entityConstructor: EntityConstructor;
  @Input() isConditionalMode: boolean = false;

  colorFieldOptions: SimpleDropdownValue[] = [];
  selectedColorField: string = null;

  ngOnInit(): void {
    this.initColorFieldOptions();
    this.detectSelectedField();
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
   * Get conditional mappings
   */
  getConditionalMappings(): ColorMapping[] {
    if (!Array.isArray(this.value)) {
      return [];
    }

    return this.value.filter(
      (mapping) =>
        mapping.condition && Object.keys(mapping.condition).length > 0,
    );
  }

  /**
   * Update conditional mappings (preserves fallback color if present)
   */
  onConditionalMappingsChange(newMappings: ColorMapping[]): void {
    // Guard against invalid input
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
   * Detect which field is being used from existing conditional mappings.
   */
  private detectSelectedField(): void {
    const conditionalMappings = this.getConditionalMappings();
    if (conditionalMappings.length === 0) {
      return;
    }

    const firstCondition = conditionalMappings[0]?.condition;
    if (firstCondition && typeof firstCondition === "object") {
      const fieldKey = Object.keys(firstCondition)[0];
      if (fieldKey) {
        this.selectedColorField = fieldKey;
      }
    }
  }

  onColorFieldSelected(fieldKey: string | string[]): void {
    const selectedField = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;

    // Reset conditional mappings if field changes
    if (this.selectedColorField && this.selectedColorField !== selectedField) {
      this.onConditionalMappingsChange([]);
    }

    this.selectedColorField = selectedField;

    const currentMappings = this.getConditionalMappings();
    if (currentMappings.length === 0) {
      this.addNewRule();
    }
  }

  /**
   * Add a new color mapping rule
   */
  addNewRule(): void {
    if (!this.selectedColorField) {
      return;
    }

    const currentMappings = this.getConditionalMappings();
    const newMapping: ColorMapping = {
      condition: { [this.selectedColorField]: "" },
      color: "",
    };

    this.onConditionalMappingsChange([...currentMappings, newMapping]);
  }

  /**
   * Update the condition of a specific mapping
   */
  updateRuleCondition(index: number, newCondition: any): void {
    // Guard against undefined/null (e.g., when dialog is cancelled)
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
    this.detectSelectedField();
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
    this.onConditionalMappingsChange([...currentMappings]);
  }
}
