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
  @Input() entityConstructor: EntityConstructor;

  @Output() conditionsChange = new EventEmitter<any>();

  private readonly conditionsSignal = signal<any>({ $or: [] });

  conditionFormFieldConfigs = new Map<string, FormFieldConfig>();
  conditionFormControls = new Map<string, FormControl>();

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    if (!this.entityConstructor) return;
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
    const allowMultiValueCondition = this.shouldUseMultiSelectCondition(
      fieldConfig,
      editComponent,
    );
    const conditionFieldConfig = {
      ...fieldConfig,
      isArray: allowMultiValueCondition,
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
      isArray: allowMultiValueCondition,
    } as FormFieldConfig);
  }

  private extractValueFromCondition(
    conditionValue: any,
    fieldConfig: EntitySchemaField,
    conditionFieldConfig: EntitySchemaField,
  ): any {
    let value;
    if (fieldConfig.isArray && conditionValue?.$elemMatch?.$in) {
      // For array fields, extract value from $elemMatch.$in if present
      value = conditionValue.$elemMatch.$in;
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

  /**
   * For certain data types, we allow users to select more than one value.
   * The condition then accepts any of the selected values.
   */
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
        this.conditions = result;
        this.conditionsSignal.set(result);
        this.rebuildFormConfigs();
        this.conditionsChange.emit(this.conditions);
      }
    });
  }
}
