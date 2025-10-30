import { Component, inject, Input, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { ColorMapping } from "app/core/entity/model/entity";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ColorInputComponent } from "app/color-input/color-input.component";

/**
 * A form control for configuring conditional colors based on entity fields.
 * Manages the full color value (string | ColorMapping[]) and handles conversion
 * between static and conditional modes.
 *
 * Supports conditional colors based on any field type:
 * - For ConfigurableEnum fields: Auto-generates template with all enum values
 * - For other field types: Provides basic example template that users customize
 * - Users can define complex MongoDB-style queries in the JSON editor
 *
 * In conditional mode, the static/default color is stored as a mapping with
 * an empty condition {} at the end of the array.
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
  ],
})
export class ConditionalColorConfigComponent
  extends CustomFormControlDirective<string | ColorMapping[]>
  implements OnInit
{
  private dialog = inject(MatDialog);
  private enumService = inject(ConfigurableEnumService);

  @Input() entityConstructor: EntityConstructor;

  colorFieldOptions: SimpleDropdownValue[] = [];
  selectedColorField: string = null;

  ngOnInit(): void {
    this.initColorFieldOptions();
    this.detectSelectedField();
  }

  /**
   * Initialize dropdown options for fields that can be used for conditional colors.
   * Now supports any field type - users define conditions manually in the JSON editor.
   */
  private initColorFieldOptions() {
    if (!this.entityConstructor?.schema) {
      return;
    }

    this.colorFieldOptions = Array.from(this.entityConstructor.schema.entries())
      .filter(([key, field]) => field.label)
      .map(([key, field]) => ({ value: key, label: field.label }));
  }

  /**
   * Check if the component is in conditional mode
   */
  isConditionalMode(): boolean {
    return Array.isArray(this.value);
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
  onStaticColorChange(newColor: string) {
    if (typeof this.value === "string") {
      this.value = newColor;
      this.onChange(newColor);
    } else if (Array.isArray(this.value)) {
      const updatedMappings = this.value.filter(
        (mapping) =>
          mapping.condition && Object.keys(mapping.condition).length > 0,
      );

      if (newColor) {
        updatedMappings.push({
          condition: {},
          color: newColor,
        });
      }

      this.value = updatedMappings;
      this.onChange(updatedMappings);
    } else {
      this.value = newColor;
      this.onChange(newColor);
    }
  }

  /**
   * Get conditional mappings (without fallback)
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
   * Update conditional mappings (preserving fallback)
   */
  onConditionalMappingsChange(newMappings: ColorMapping[]) {
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
   * Detect which field is being used from existing value
   */
  private detectSelectedField() {
    const conditionalMappings = this.getConditionalMappings();
    if (conditionalMappings.length > 0) {
      const firstCondition = conditionalMappings[0]?.condition;
      if (firstCondition && typeof firstCondition === "object") {
        const fieldKey = Object.keys(firstCondition)[0];
        this.selectedColorField = fieldKey;
      }
    }
  }

  /**
   * Called when user selects a field for conditional colors
   */
  onColorFieldSelected(fieldKey: string | string[]) {
    const selectedField = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;
    this.selectedColorField = selectedField;
  }

  /**
   * Open JSON editor for conditional color configuration
   */
  openColorJsonEditor() {
    const conditionalMappings = this.getConditionalMappings();
    let initialValue = conditionalMappings;

    if (this.selectedColorField && conditionalMappings.length === 0) {
      initialValue = this.generateColorMappingTemplate(this.selectedColorField);
    }

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: initialValue,
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.onConditionalMappingsChange(result);
        this.detectSelectedField(); // Update selected field from new value
      }
    });
  }

  /**
   * Generate a template ColorMapping array for the selected field.
   * For ConfigurableEnum fields, generates entries for all enum values.
   * For other field types, generates a basic example template.
   */
  private generateColorMappingTemplate(fieldKey: string): ColorMapping[] {
    const field = this.entityConstructor.schema.get(fieldKey);
    if (!field) {
      return this.getBasicTemplate(fieldKey);
    }

    // Special handling for ConfigurableEnum fields
    if (
      field.dataType === ConfigurableEnumDatatype.dataType &&
      field.additional
    ) {
      const enumId = field.additional;
      const enumEntity = this.enumService.getEnum(enumId);

      if (enumEntity && Array.isArray(enumEntity.values)) {
        // Generate template with all enum options and empty colors
        return enumEntity.values.map((enumValue) => ({
          condition: { [fieldKey]: enumValue.id },
          color: "",
        }));
      }
    }

    return this.getBasicTemplate(fieldKey);
  }

  /**
   * Generate a basic example template for any field type
   */
  private getBasicTemplate(fieldKey: string): ColorMapping[] {
    return [
      {
        condition: { [fieldKey]: "example-value" },
        color: "#FF0000",
      },
      {
        condition: { [fieldKey]: "another-value" },
        color: "#00FF00",
      },
    ];
  }
}
