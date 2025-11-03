import { Component, inject, Input, OnInit } from "@angular/core";
import {
  MatFormFieldModule,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ColorInputComponent } from "app/color-input/color-input.component";

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
  ],
})
export class ConditionalColorConfigComponent
  extends CustomFormControlDirective<string | ColorMapping[]>
  implements OnInit
{
  private readonly dialog = inject(MatDialog);
  private readonly enumService = inject(ConfigurableEnumService);

  @Input() entityConstructor: EntityConstructor;

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

  /**
   * Called when user selects a field for conditional colors.
   * Clears existing conditional mappings when changing fields.
   */
  onColorFieldSelected(fieldKey: string | string[]): void {
    const selectedField = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;

    // Reset conditional mappings if field changes
    if (this.selectedColorField && this.selectedColorField !== selectedField) {
      this.onConditionalMappingsChange([]);
    }

    this.selectedColorField = selectedField;
  }

  /**
   * Open JSON editor for conditional color configuration.
   * Auto-generates template for selected field if no mappings exist.
   */
  openColorJsonEditor(): void {
    const conditionalMappings = this.getConditionalMappings();
    const initialValue =
      this.selectedColorField && conditionalMappings.length === 0
        ? this.generateColorMappingTemplate(this.selectedColorField)
        : conditionalMappings;

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: initialValue,
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.onConditionalMappingsChange(result);
        this.detectSelectedField();
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

    // Special handling for ConfigurableEnum fields: auto-generate mappings for all enum values
    // todo : may be we can remove this also
    if (
      field.dataType === ConfigurableEnumDatatype.dataType &&
      field.additional
    ) {
      const enumEntity = this.enumService.getEnum(field.additional);

      if (enumEntity?.values?.length > 0) {
        return enumEntity.values.map((enumValue) => ({
          condition: { [fieldKey]: enumValue.id },
          color: "",
        }));
      }
    }

    return this.getBasicTemplate(fieldKey);
  }

  /**
   * Generate a basic example template for any field type.
   * Provides two sample conditions with distinct colors.
   * todo: may be we can remove this also
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
