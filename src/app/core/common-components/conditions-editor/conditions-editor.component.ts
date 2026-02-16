import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  computed,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { EntityConstructor } from "app/core/entity/model/entity";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { DynamicEditComponent } from "app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { IconButtonComponent } from "../icon-button/icon-button.component";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/**
 * Reusable component for editing conditions (field-value pairs) with JSON support
 */
@Component({
  selector: "app-conditions-editor",
  templateUrl: "./conditions-editor.component.html",
  styleUrls: ["./conditions-editor.component.scss"],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatTooltipModule,
    IconButtonComponent,
    FontAwesomeModule,
    DynamicEditComponent,
    ReactiveFormsModule,
    EntityFieldSelectComponent,
  ],
})
export class ConditionsEditorComponent implements OnInit {
  @Input() conditions: any = { $or: [] };
  @Input() entityConstructor?: EntityConstructor;
  @Input() disabled = false;
  @Input() label = $localize`Edit JSON`;

  @Output() conditionsChange = new EventEmitter<any>();

  private readonly conditionsSignal = signal<any>({ $or: [] });

  conditionFormFieldConfigs = new Map<string, FormFieldConfig>();
  conditionFormControls = new Map<string, FormControl>();

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    if (!this.entityConstructor) return;
    this.conditions = this.normalizeConditions(this.conditions);
    this.conditionsSignal.set(this.conditions);
    this.rebuildFormConfigs();
  }

  /**
   * Computed signal for the conditions array
   */
  conditionsArray = computed(() => this.conditionsSignal()?.$or || []);

  /**
   * Get the field key from a condition object (static helper)
   */
  getConditionField(condition: any): string {
    return Object.keys(condition || {})[0] || "";
  }

  /**
   * Add a new condition
   */
  addCondition(): void {
    if (!this.conditions.$or) {
      this.conditions.$or = [];
    }

    this.conditions.$or.push({});
    this.conditionsSignal.set({ ...this.conditions });
    this.conditionsChange.emit(this.conditions);
  }

  /**
   * Delete a condition
   */
  deleteCondition(conditionIndex: number): void {
    const conditions = this.conditionsArray();
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    conditions.splice(conditionIndex, 1);
    this.conditionsSignal.set({ ...this.conditions });

    this.rebuildFormConfigs();
    this.conditionsChange.emit(this.conditions);
  }

  /**
   * Handle condition field change
   */
  onConditionFieldChange(
    conditionIndex: number,
    fieldKey: string | string[],
  ): void {
    const conditions = this.conditionsArray();
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    const actualFieldKey = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;
    if (!actualFieldKey) return;

    const condition = conditions[conditionIndex];
    const currentFieldKey = this.getConditionField(condition);

    // Only update if the field actually changed
    if (currentFieldKey === actualFieldKey) return;

    Object.keys(condition).forEach((key) => delete condition[key]);
    condition[actualFieldKey] = null;
    this.conditionsSignal.set({ ...this.conditions });

    this.createFormConfigForCondition(conditionIndex, actualFieldKey);
    this.conditionsChange.emit(this.conditions);
  }

  /**
   * Create form configuration for a specific condition
   */
  private createFormConfigForCondition(
    conditionIndex: number,
    fieldKey: string,
  ): void {
    const key = `${conditionIndex}`;
    const fieldConfig = this.entityConstructor.schema.get(fieldKey);
    if (!fieldConfig) return;
    const editComponent = this.entitySchemaService.getComponent(
      fieldConfig,
      "edit",
    );
    const isDropdownMultiSelect = this.shouldUseMultiSelectCondition(
      fieldConfig,
      editComponent,
    );
    const conditionFieldConfig = {
      ...fieldConfig,
      isArray: isDropdownMultiSelect,
    };

    const conditions = this.conditionsArray();
    const condition = conditions[conditionIndex];

    const initialValue = this.extractValueFromCondition(
      condition[fieldKey],
      fieldConfig,
      conditionFieldConfig,
    );
    const formControl = new FormControl(initialValue);
    this.conditionFormControls.set(key, formControl);

    formControl.valueChanges.subscribe((value) =>
      this.onFormValueChange(
        condition,
        fieldKey,
        value,
        fieldConfig,
        conditionFieldConfig,
      ),
    );

    this.conditionFormFieldConfigs.set(key, {
      id: fieldKey,
      editComponent,
      dataType: fieldConfig.dataType,
      additional: fieldConfig.additional,
      label: fieldConfig.label || fieldKey,
      isArray: isDropdownMultiSelect,
    } as FormFieldConfig);
  }

  /**
   * Extract the actual value from various condition formats (current and legacy).
   * Supports:
   * - Standard array format: { $elemMatch: { $in: [...] } }
   * - Legacy array formats: { $elemMatch: "id" } or { $elemMatch: { $eq: "id" } }
   * - Dropdown multi-select: { $in: [...] }
   * - Direct values for other field types
   */
  private extractValueFromCondition(
    conditionValue: any,
    fieldConfig: EntitySchemaField,
    conditionFieldConfig: EntitySchemaField,
  ): any {
    let value;
    if (fieldConfig.isArray && conditionValue?.$elemMatch?.$in) {
      // For array fields, extract value from $elemMatch.$in if present
      value = conditionValue.$elemMatch.$in;
    } else if (
      fieldConfig.isArray &&
      conditionValue?.$elemMatch !== undefined
    ) {
      // Support legacy array-condition format: { $elemMatch: "id" }
      const elemMatch = conditionValue.$elemMatch;
      if (Array.isArray(elemMatch)) {
        value = elemMatch;
      } else {
        value = [elemMatch];
      }
    } else if (!fieldConfig.isArray && conditionValue?.$in) {
      // For non-array dropdown fields, extract value from $in
      value = conditionValue.$in;
    } else {
      value = conditionValue;
    }

    return this.entitySchemaService.valueToEntityFormat(
      value,
      conditionFieldConfig,
    );
  }

  private onFormValueChange(
    condition: any,
    fieldKey: string,
    value: any,
    fieldConfig: EntitySchemaField,
    conditionFieldConfig: EntitySchemaField,
  ): void {
    const dbValue = this.entitySchemaService.valueToDatabaseFormat(
      value,
      conditionFieldConfig,
    );

    if (fieldConfig.isArray && Array.isArray(dbValue) && dbValue.length > 0) {
      // For array fields, wrap in $elemMatch with $in for proper array matching
      condition[fieldKey] = { $elemMatch: { $in: dbValue } };
    } else if (
      !fieldConfig.isArray &&
      conditionFieldConfig.isArray &&
      Array.isArray(dbValue) &&
      dbValue.length > 0
    ) {
      // For non-array dropdown fields, wrap multi selection in $in
      condition[fieldKey] = { $in: dbValue };
    } else {
      condition[fieldKey] = dbValue;
    }

    this.conditionsChange.emit(this.conditions);
  }

  private shouldUseMultiSelectCondition(
    fieldConfig: EntitySchemaField,
    editComponent: string,
  ): boolean {
    if (fieldConfig.isArray) {
      return true;
    }

    return (
      editComponent === "EditConfigurableEnum" ||
      editComponent === "EditEntity" ||
      editComponent === "EditEntityType"
    );
  }

  /**
   * Rebuild form configs for all conditions
   */
  private rebuildFormConfigs(): void {
    this.conditionFormFieldConfigs.clear();
    this.conditionFormControls.clear();

    this.conditionsArray().forEach((condition, index) => {
      const fieldKey = this.getConditionField(condition);
      if (fieldKey) {
        this.createFormConfigForCondition(index, fieldKey);
      }
    });
  }

  /**
   * Open JSON editor for conditions
   */
  openJsonEditor(): void {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.conditions, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.conditions = this.normalizeConditions(result);
        this.conditionsSignal.set(this.conditions);
        this.rebuildFormConfigs();
        this.conditionsChange.emit(this.conditions);
      }
    });
  }

  /**
   * Normalize conditions to the standard { $or: [...] } format.
   * Handles both current format and legacy formats where conditions were stored
   * as direct key-value pairs without the $or wrapper.
   *
   * @param input - The conditions object to normalize
   * @returns Normalized conditions in { $or: [...] } format
   */
  private normalizeConditions(input: any): { $or: Record<string, any>[] } {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { $or: [] };
    }

    const existingOr = Array.isArray(input.$or)
      ? input.$or.filter(
          (condition) => condition && typeof condition === "object",
        )
      : [];
    if (existingOr.length > 0) {
      // Prefer the explicit $or format to avoid keeping duplicated legacy keys.
      return { $or: existingOr };
    }

    const legacyEntries = Object.entries(input).filter(
      ([key]) => key !== "$or",
    );
    return {
      $or: legacyEntries.map(([key, value]) => ({ [key]: value })),
    };
  }
}
