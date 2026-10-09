import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  computed,
  input,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
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
import { negate, splitNegation, withSameNegation } from "./condition-negation";
import {
  buildConditions,
  Combinator,
  DEFAULT_COMBINATOR,
  parseConditions,
} from "./conditions-combinator";

/**
 * Reusable component for editing conditions (field-value pairs) with JSON support
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-conditions-editor",
  templateUrl: "./conditions-editor.component.html",
  styleUrls: ["./conditions-editor.component.scss"],
  imports: [
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonToggleModule,
    IconButtonComponent,
    FontAwesomeModule,
    DynamicEditComponent,
    ReactiveFormsModule,
    EntityFieldSelectComponent,
  ],
})
export class ConditionsEditorComponent implements OnInit {
  @Input() conditions: any = {};
  @Input() entityConstructor?: EntityConstructor;
  @Input() disabled = false;
  @Input() label = $localize`Edit JSON`;

  /** whether every row has to match ("all", and) or any one row ("any", or) */
  readonly combinator = signal<Combinator>(DEFAULT_COMBINATOR);

  readonly combinatorHint = computed(() =>
    this.combinator() === "any"
      ? $localize`Matches if any one of the conditions applies ("or" conditions).`
      : $localize`Matches only if all conditions apply ("and" conditions).`,
  );

  /** also offer the internal "_id" field in the field dropdown (e.g. for permission conditions) */
  readonly showInternalIdField = input(false);

  @Output() conditionsChange = new EventEmitter<any>();

  private readonly conditionsSignal = signal<any>({});

  /**
   * The rows being edited, as `{ $or: rows }`. It is not the `conditions` input: parents that
   * store what the editor emits bind it straight back into that input, which is only read once,
   * when the editor starts.
   */
  private working: { $or?: any[] } = {};

  conditionFormFieldConfigs = new Map<string, FormFieldConfig>();
  conditionFormControls = new Map<string, FormControl>();

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    if (!this.entityConstructor) return;
    this.loadConditions(this.conditions);
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

  /** whether the given row's stored condition is negated */
  isNegated(conditionIndex: number): boolean {
    const condition = this.conditionsArray()[conditionIndex];
    const fieldKey = this.getConditionField(condition);
    return splitNegation(condition?.[fieldKey]).negated;
  }

  /** switch a row between "is" and "is not", keeping its value */
  setNegated(conditionIndex: number, negated: boolean): void {
    const condition = this.conditionsArray()[conditionIndex];
    const fieldKey = this.getConditionField(condition);
    if (!fieldKey) return;

    const { positive } = splitNegation(condition[fieldKey]);
    condition[fieldKey] = negated ? negate(positive) : positive;

    this.conditionsSignal.set({ ...this.working });
    this.emitConditions();
  }

  setCombinator(combinator: Combinator): void {
    this.combinator.set(combinator);
    this.emitConditions();
  }

  /**
   * Add a new condition
   */
  addCondition(): void {
    if (!this.working.$or) {
      this.working.$or = [];
    }

    this.working.$or.push({});
    this.conditionsSignal.set({ ...this.working });
    this.emitConditions();
  }

  /**
   * Delete a condition
   */
  deleteCondition(conditionIndex: number): void {
    const conditions = this.conditionsArray();
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    conditions.splice(conditionIndex, 1);

    if (conditions.length === 0) {
      this.working = {};
      this.conditionsSignal.set({});
    } else {
      this.conditionsSignal.set({ ...this.working });
    }

    this.rebuildFormConfigs();
    this.emitConditions();
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
    this.conditionsSignal.set({ ...this.working });

    this.createFormConfigForCondition(conditionIndex, actualFieldKey);
    this.emitConditions();
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

  private extractValueFromCondition(
    conditionValue: any,
    fieldConfig: EntitySchemaField,
    conditionFieldConfig: EntitySchemaField,
  ): any {
    // a negated condition still edits the value inside it
    const { positive } = splitNegation(conditionValue);

    let value;
    if (fieldConfig.isArray && positive?.$elemMatch?.$in) {
      // For array fields, extract value from $elemMatch.$in if present
      value = positive.$elemMatch.$in;
    } else if (fieldConfig.isArray && positive?.$elemMatch !== undefined) {
      // Support legacy array-condition format: { $elemMatch: "id" }
      const elemMatch = positive.$elemMatch;
      if (Array.isArray(elemMatch)) {
        value = elemMatch;
      } else {
        value = [elemMatch];
      }
    } else if (!fieldConfig.isArray && positive?.$in) {
      // For non-array dropdown fields, extract value from $in
      value = positive.$in;
    } else if (positive?.$eq !== undefined) {
      // a negated plain value is stored as $eq, which the value control cannot render
      value = positive.$eq;
    } else {
      value = positive;
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
    const previous = condition[fieldKey];

    const dbValue = this.entitySchemaService.valueToDatabaseFormat(
      value,
      conditionFieldConfig,
    );

    let positive: any;
    if (fieldConfig.isArray && Array.isArray(dbValue) && dbValue.length > 0) {
      // For array fields, wrap in $elemMatch with $in for proper array matching
      positive = { $elemMatch: { $in: dbValue } };
    } else if (
      !fieldConfig.isArray &&
      conditionFieldConfig.isArray &&
      Array.isArray(dbValue) &&
      dbValue.length > 0
    ) {
      // For non-array dropdown fields, wrap multi selection in $in
      positive = { $in: dbValue };
    } else {
      positive = dbValue;
    }

    condition[fieldKey] = withSameNegation(previous, positive);

    this.emitConditions();
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
      data: {
        value: buildConditions(this.combinator(), this.working.$or ?? []),
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadConditions(result);
        this.rebuildFormConfigs();
        this.emitConditions();
      }
    });
  }

  /** The stored condition becomes the editor's working state: its combinator and its rows. */
  private loadConditions(stored: any): void {
    const { combinator, rows } = parseConditions(stored);
    this.combinator.set(combinator);
    this.working = rows.length > 0 ? { $or: rows } : {};
    this.conditionsSignal.set(this.working);
  }

  /** Report the rows in their stored shape; rows that are not filled in yet stay out of it. */
  private emitConditions(): void {
    this.conditionsChange.emit(
      buildConditions(this.combinator(), this.working.$or ?? []),
    );
  }
}
