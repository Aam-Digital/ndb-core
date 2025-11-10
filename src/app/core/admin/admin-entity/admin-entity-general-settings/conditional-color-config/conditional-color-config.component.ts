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
import { MatDialog } from "@angular/material/dialog";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ColorInputComponent } from "app/color-input/color-input.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicEditComponent } from "app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";

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
  private dialog = inject(MatDialog);

  colorFieldOptions: SimpleDropdownValue[] = [];
  conditionFormFieldConfigs = new Map<number, FormFieldConfig>();
  conditionFormControls = new Map<number, FormControl>();

  // Cached values to avoid recalculating in template
  get staticColor(): string {
    if (typeof this.value === "string") return this.value;
    if (!Array.isArray(this.value)) return "";
    return this.value.find((m) => !Object.keys(m.condition || {}).length)?.color || "";
  }

  get conditionalColor(): string {
    if (!Array.isArray(this.value)) return "";
    const conditionalMapping = this.value.find((m) => (m.condition as any)?.$or);
    return conditionalMapping?.color || "";
  }

  get conditionalMappings(): any[] {
    if (!Array.isArray(this.value)) return [];
    const mapping = this.value.find((m) => (m.condition as any)?.$or);
    return (mapping?.condition as any)?.$or || [];
  }

  addConditionalMode(): void {
    this.isConditionalModeChange.emit(true);
  }

  removeConditionalMode(): void {
    this.isConditionalModeChange.emit(false);
  }

  ngOnInit(): void {
    this.colorFieldOptions = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, field]) => field.label)
      .map(([key, field]) => ({ value: key, label: field.label }));
    this.initializeFormControls();
  }

  /**
   * Initialize form controls for existing conditions
   */
  private initializeFormControls(): void {
    this.conditionalMappings.forEach((condition, index) => {
      const fieldKey = Object.keys(condition)[0];
      if (fieldKey) {
        this.createFormConfigForMapping(condition, index, fieldKey);
      }
    });
  }

  /**
   * Get the field key from a condition object
   */
  getConditionField(condition: any): string {
    return Object.keys(condition || {})[0] || "";
  }

  /**
   * Handle condition field selection change
   */
  onConditionFieldChange(index: number, fieldKey: string): void {
    const conditions: any[] = [...this.conditionalMappings];
    if (!conditions[index]) return;

    conditions[index] = { [fieldKey]: "" };
    this.updateConditionalMappings(conditions);
    setTimeout(() => this.createFormConfigForMapping(conditions[index], index, fieldKey));
  }

  /**
   * Build the ColorMapping array from conditions and colors
   */
  private buildValue(conditions: any[], conditionalColor: string, staticColor: string): ColorMapping[] {
    const result: ColorMapping[] = [];
    
    if (conditions.length > 0) {
      result.push({ color: conditionalColor, condition: { $or: conditions } });
    }
    
    if (staticColor) {
      result.push({ color: staticColor, condition: {} });
    }
    
    return result;
  }

  /**
   * Update the static/default color
   */
  onStaticColorChange(newColor: string): void {
    if (!Array.isArray(this.value)) {
      this.value = newColor;
      this.onChange(newColor);
      return;
    }

    this.value = this.buildValue(this.conditionalMappings, this.conditionalColor, newColor);
    this.onChange(this.value);
  }

  /**
   * Update the conditional color (applies to all conditions)
   */
  onConditionalColorChange(newColor: string): void {
    if (!Array.isArray(this.value)) return;

    this.value = this.buildValue(this.conditionalMappings, newColor, this.staticColor);
    this.onChange(this.value);
  }

  /**
   * Update conditional mappings with new $or array
   */
  private updateConditionalMappings(newConditions: any[]): void {
    this.value = this.buildValue(newConditions, this.conditionalColor, this.staticColor);
    this.onChange(this.value);
  }

  /**
   * Add a new color mapping rule
   */
  addNewRule(): void {
    const defaultField = this.colorFieldOptions[0]?.value;
    if (!defaultField) return;

    const conditions: any[] = [...this.conditionalMappings];
    conditions.push({ [defaultField]: "" });

    this.updateConditionalMappings(conditions);
    setTimeout(() => this.createFormConfigForMapping(conditions[conditions.length - 1], conditions.length - 1, defaultField));
  }

  /**
   * Delete a specific condition
   */
  deleteRule(index: number): void {
    const conditions: any[] = [...this.conditionalMappings];
    if (!conditions[index]) return;

    conditions.splice(index, 1);
    this.conditionFormFieldConfigs.delete(index);
    this.conditionFormControls.delete(index);
    this.updateConditionalMappings(conditions);
  }

  /**
   * Create FormFieldConfig for a condition based on the selected field's schema
   */
  private createFormConfigForMapping(condition: any, index: number, fieldKey: string): void {
    const fieldSchema = this.entityConstructor?.schema?.get(fieldKey);
    if (!fieldSchema) return;

    const formControl = new FormControl(condition[fieldKey]);
    this.conditionFormControls.set(index, formControl);

    formControl.valueChanges.subscribe((value) => {
      setTimeout(() => {
        const conditions: any[] = [...this.conditionalMappings];
        if (conditions[index]) {
          const currentField = this.getConditionField(conditions[index]);
          if (currentField) {
            conditions[index] = { [currentField]: value };
            this.updateConditionalMappings(conditions);
          }
        }
      });
    });

    this.conditionFormFieldConfigs.set(index, {
      id: fieldKey,
      editComponent: this.entitySchemaService.getComponent(fieldSchema, "edit"),
      dataType: fieldSchema.dataType,
      additional: fieldSchema.additional,
      label: fieldSchema.label || fieldKey,
    });
  }

  /**
   * Open full JSON editor for all conditions
   */
  openFullJsonEditor(): void {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.conditionalMappings, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && Array.isArray(result)) {
        this.updateConditionalMappings(result);
        this.conditionFormFieldConfigs.clear();
        this.conditionFormControls.clear();
        this.initializeFormControls();
      }
    });
  }
}
