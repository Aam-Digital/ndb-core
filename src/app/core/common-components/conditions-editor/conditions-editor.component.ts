import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  computed,
  input,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { DynamicEditComponent } from "app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { IconButtonComponent } from "../icon-button/icon-button.component";
import { FaDynamicIconComponent } from "../fa-dynamic-icon/fa-dynamic-icon.component";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { negate, splitNegation, withSameNegation } from "./condition-negation";
import {
  shouldUseMultiSelectCondition,
  unwrapConditionValue,
  wrapConditionValue,
} from "./condition-value";
import {
  buildConditions,
  Combinator,
  DEFAULT_COMBINATOR,
  isCompleteRow,
  parseConditions,
} from "./conditions-combinator";
import { fieldOptions, FilterService } from "../../filter/filter.service";
import {
  CURRENT_RECORD_PLACEHOLDER_PREFIX,
  DataFilter,
  isCurrentRecordPlaceholder,
  placeholderFieldId,
} from "../../filter/filters/filters";
import { asArray } from "app/utils/asArray";
import { isEqual } from "lodash-es";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import {
  EntityRelationsService,
  LinkedTypeFields,
} from "../../entity/entity-mapper/entity-relations.service";
import { resolveLocaleText } from "../../language/active-locale";

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
    NgTemplateOutlet,
    FaDynamicIconComponent,
  ],
})
export class ConditionsEditorComponent implements OnInit, OnChanges {
  @Input() conditions: any = {};
  readonly entityConstructor = input<EntityConstructor>();
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

  /**
   * (Optional) type of the record being edited when the condition is applied.
   * If given, a condition row can compare with a field of that record instead of a fixed value.
   */
  readonly currentRecordType = input<EntityConstructor>();

  /**
   * The conditions are matched against the stored documents (e.g. permissions, notification rules),
   * so embedded fields whose entries are stored in another shape are only offered whole (see `FilterService.getConditionFields`).
   */
  readonly onStoredDocuments = input(false);

  /**
   * The fields of the records that the current record links to ("link field › field"),
   * which a row can compare with like with a field of the current record itself.
   */
  readonly linkedRecordFields = computed<FormFieldConfig[]>(() => {
    const recordType = this.currentRecordType();
    if (!recordType) return [];

    return (
      this.entityRelations
        .getFieldsOfLinkedTypes(recordType)
        // a link to several record types has no single set of fields
        .filter(({ link }) => asArray(link.additional ?? []).length === 1)
        .flatMap(linkedFieldOptions)
    );
  });

  /**
   * The fields a row can compare with: those of the current record itself first,
   * then those of the records it links to.
   */
  readonly referenceFieldOptions = computed<FormFieldConfig[]>(() => {
    const recordType = this.currentRecordType();
    if (!recordType) return [];

    return [
      ...fieldOptions([...recordType.schema.entries()]),
      ...this.linkedRecordFields(),
    ];
  });

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

  /** per row: hides the fields of the current record whose values cannot be compared with the row's field */
  referenceFieldFilters = new Map<
    string,
    (field: FormFieldConfig) => boolean
  >();

  /** rows switched to compare with a field of the current record, before that field is selected */
  private readonly referenceRows = new WeakSet<object>();

  /** the fields a condition can be set on, with the properties of embedded fields in their place (see `FilterService.getConditionFields`) */
  readonly conditionFields = computed(() => {
    const entityType = this.entityConstructor();
    return entityType
      ? this.filterService.getConditionFields(
          entityType,
          this.onStoredDocuments(),
        )
      : { options: [], excludedFields: [] };
  });

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly filterService = inject(FilterService);
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.showConditions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // the record type may only be chosen once the editor is shown (e.g. in a notification rule)
    if (changes["entityConstructor"]?.firstChange === false) {
      this.showConditions();
    }
  }

  /** shows the rows of the `conditions` input, once there is a record type to edit them for */
  private showConditions(): void {
    if (!this.entityConstructor()) return;
    this.loadConditions(this.conditions);
    this.rebuildFormConfigs();
  }

  conditionsArray = computed(() => this.conditionsSignal()?.$or || []);

  getConditionField(condition: any): string {
    return Object.keys(condition || {})[0] || "";
  }

  /** the row at the index with the field it is about (empty while none is chosen), none if there is no such row */
  private rowAt(
    conditionIndex: number,
  ): { condition: any; fieldKey: string } | undefined {
    const condition = this.conditionsArray()[conditionIndex];
    return condition
      ? { condition, fieldKey: this.getConditionField(condition) }
      : undefined;
  }

  /** the rows are edited in place, so this hands the template and the computed values a new object to read them again */
  private refreshRows(): void {
    this.conditionsSignal.set({ ...this.working });
  }

  /** shows the changed rows and reports them */
  private commit(): void {
    this.refreshRows();
    this.emitConditions();
  }

  isNegated(conditionIndex: number): boolean {
    const row = this.rowAt(conditionIndex);
    return !!row && splitNegation(row.condition[row.fieldKey]).negated;
  }

  /** switch a row between "is" and "is not", keeping its value */
  setNegated(conditionIndex: number, negated: boolean): void {
    const row = this.rowAt(conditionIndex);
    if (!row?.fieldKey) return;

    const { condition, fieldKey } = row;
    const { positive } = splitNegation(condition[fieldKey]);
    condition[fieldKey] = negated ? negate(positive) : positive;

    this.commit();
  }

  setCombinator(combinator: Combinator): void {
    this.combinator.set(combinator);
    this.emitConditions();
  }

  /**
   * Per row: whether it compares with a field of the current record instead of a fixed value,
   * and the id of that field once it is chosen. Kept once per change of the rows for the template.
   * Reads `conditionsSignal`, which gets a new object on every change, as the rows are edited in place.
   */
  readonly rowReferences = computed(() =>
    (this.conditionsSignal()?.$or ?? []).map((condition) =>
      this.referenceOf(condition),
    ),
  );

  /** whether the given row compares with a field of the current record instead of a fixed value */
  isReferenceRow(conditionIndex: number): boolean {
    return this.rowReferences()[conditionIndex]?.isReference ?? false;
  }

  private referenceOf(condition: Record<string, unknown>): {
    isReference: boolean;
    referencedField?: string;
  } {
    const { positive } = splitNegation(
      condition?.[this.getConditionField(condition)],
    );
    const placeholder = [
      positive,
      positive?.$eq,
      positive?.$in?.[0],
      positive?.$elemMatch?.$in?.[0],
    ].find(isCurrentRecordPlaceholder);
    const referencedField = placeholder && placeholderFieldId(placeholder);
    return {
      isReference:
        !!this.currentRecordType() &&
        (this.referenceRows.has(condition) || referencedField !== undefined),
      referencedField,
    };
  }

  /** switch a row between comparing with a fixed value and with a field of the current record */
  setReferenceRow(conditionIndex: number, isReference: boolean): void {
    const row = this.rowAt(conditionIndex);
    if (!row?.fieldKey || this.isReferenceRow(conditionIndex) === isReference) {
      return;
    }

    const { condition, fieldKey } = row;
    if (isReference) {
      this.referenceRows.add(condition);
    } else {
      this.referenceRows.delete(condition);
    }
    // the value does not fit the new mode, an "is not" the admin chose still applies
    condition[fieldKey] = withSameNegation(condition[fieldKey], null);
    this.refreshRows();
    this.createFormConfigForCondition(conditionIndex, fieldKey);

    this.emitConditions();
  }

  onReferencedFieldChange(
    conditionIndex: number,
    recordFieldId: string | string[],
  ): void {
    const actualRecordFieldId = Array.isArray(recordFieldId)
      ? recordFieldId[0]
      : recordFieldId;
    const row = this.rowAt(conditionIndex);
    if (!row || !actualRecordFieldId) return;

    const { condition, fieldKey } = row;
    const fieldConfig = this.fieldConfigOf(fieldKey);
    if (!fieldConfig) return;

    const placeholder = CURRENT_RECORD_PLACEHOLDER_PREFIX + actualRecordFieldId;
    const recordField =
      this.currentRecordType()?.schema.get(actualRecordFieldId) ??
      this.linkedRecordFields().find(({ id }) => id === actualRecordFieldId);
    const conditionFieldConfig = {
      ...fieldConfig,
      // the placeholder resolves to all values of a multi-value record field, which only match in a list (`$in`)
      isArray:
        !!recordField?.isArray ||
        shouldUseMultiSelectCondition(
          fieldConfig,
          this.entitySchemaService.getComponent(fieldConfig, "edit"),
        ),
    };
    const positive = wrapConditionValue(
      fieldConfig,
      conditionFieldConfig,
      conditionFieldConfig.isArray ? [placeholder] : placeholder,
    );
    condition[fieldKey] = withSameNegation(condition[fieldKey], positive);

    this.commit();
  }

  addCondition(): void {
    if (!this.working.$or) {
      this.working.$or = [];
    }

    this.working.$or.push({});
    this.commit();
  }

  deleteCondition(conditionIndex: number): void {
    const conditions = this.conditionsArray();
    if (conditionIndex < 0 || conditionIndex >= conditions.length) return;

    conditions.splice(conditionIndex, 1);

    if (conditions.length === 0) {
      this.working = {};
    }
    this.refreshRows();

    this.rebuildFormConfigs();
    this.emitConditions();
  }

  onConditionFieldChange(
    conditionIndex: number,
    fieldKey: string | string[],
  ): void {
    const actualFieldKey = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;
    const row = this.rowAt(conditionIndex);
    if (!row || !actualFieldKey || row.fieldKey === actualFieldKey) return;

    const { condition } = row;
    Object.keys(condition).forEach((key) => delete condition[key]);
    condition[actualFieldKey] = null;
    this.referenceRows.delete(condition);
    this.refreshRows();

    this.createFormConfigForCondition(conditionIndex, actualFieldKey);
    this.emitConditions();
  }

  private createFormConfigForCondition(
    conditionIndex: number,
    fieldKey: string,
  ): void {
    const fieldConfig = this.fieldConfigOf(fieldKey);
    if (!fieldConfig) return;
    const editComponent = this.entitySchemaService.getComponent(
      fieldConfig,
      "edit",
    );
    const isDropdownMultiSelect = shouldUseMultiSelectCondition(
      fieldConfig,
      editComponent,
    );
    const conditionFieldConfig = {
      ...fieldConfig,
      isArray: isDropdownMultiSelect,
    };

    const key = `${conditionIndex}`;
    this.conditionFormControls.set(
      key,
      this.createValueControl(
        conditionIndex,
        fieldKey,
        fieldConfig,
        conditionFieldConfig,
      ),
    );
    this.conditionFormFieldConfigs.set(key, {
      id: fieldKey,
      editComponent,
      dataType: fieldConfig.dataType,
      additional: fieldConfig.additional,
      label: resolveLocaleText(fieldConfig.label) || fieldKey,
      isArray: isDropdownMultiSelect,
    } as FormFieldConfig);
    this.referenceFieldFilters.set(
      key,
      this.referenceFieldFilter(fieldKey, fieldConfig),
    );
  }

  /** the control for the value of a row, which stores the value in the row when it changes */
  private createValueControl(
    conditionIndex: number,
    fieldKey: string,
    fieldConfig: EntitySchemaField,
    conditionFieldConfig: EntitySchemaField,
  ): FormControl {
    const condition = this.conditionsArray()[conditionIndex];

    // a placeholder is not a valid value for the field's value editor (e.g. not an existing record id)
    const initialValue = this.isReferenceRow(conditionIndex)
      ? null
      : this.entitySchemaService.valueToEntityFormat(
          unwrapConditionValue(condition[fieldKey], fieldConfig),
          conditionFieldConfig,
        );
    const formControl = new FormControl(initialValue);
    formControl.valueChanges.subscribe((value) =>
      this.onFormValueChange(
        condition,
        fieldKey,
        value,
        fieldConfig,
        conditionFieldConfig,
      ),
    );
    return formControl;
  }

  /** hides the fields of the current record whose values cannot be compared with the row's field */
  private referenceFieldFilter(
    fieldKey: string,
    fieldConfig: EntitySchemaField,
  ): (recordField: FormFieldConfig) => boolean {
    // the record itself ("_id") is compared with the fields linking to records of its type
    const comparedWith: EntitySchemaField =
      fieldKey === "_id"
        ? {
            dataType: EntityDatatype.dataType,
            additional: this.entityConstructor().ENTITY_TYPE,
          }
        : fieldConfig;
    return (recordField) =>
      recordField.dataType !== comparedWith.dataType ||
      !isEqual(
        asArray(recordField.additional ?? []),
        asArray(comparedWith.additional ?? []),
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

    condition[fieldKey] = withSameNegation(
      previous,
      wrapConditionValue(fieldConfig, conditionFieldConfig, dbValue),
    );

    this.emitConditions();
  }

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

  openJsonEditor(): void {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: buildConditions(this.combinator(), this.storedRows()),
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
    this.working =
      rows.length > 0 ? { $or: rows.map((row) => this.toEditorRow(row)) } : {};
    this.conditionsSignal.set(this.working);
  }

  /** Report the rows in their stored shape; rows that are not filled in yet stay out of it. */
  private emitConditions(): void {
    this.conditionsChange.emit(
      buildConditions(this.combinator(), this.storedRows()),
    );
  }

  /** the schema of a row's field; none while no record type is chosen */
  private fieldConfigOf(fieldKey: string): EntitySchemaField | undefined {
    const entityType = this.entityConstructor();
    return (
      entityType && this.filterService.getFieldAtPath(entityType, fieldKey)
    );
  }

  /** the rows in their stored shape (see `FilterService.editorRowToCondition`) */
  private storedRows(): DataFilter<Entity>[] {
    const entityType = this.entityConstructor();
    return (this.working.$or ?? []).map((row) =>
      entityType && isCompleteRow(row)
        ? this.filterService.editorRowToCondition(entityType, row)
        : row,
    );
  }

  /** a stored condition as a row of the editor (see `FilterService.conditionToEditorRow`) */
  private toEditorRow(row: DataFilter<Entity>): DataFilter<Entity> {
    const entityType = this.entityConstructor();
    if (!entityType) return row;
    const editorRow = this.filterService.conditionToEditorRow(entityType, row);
    // an embedded field offered only whole keeps its condition as stored
    const [fieldPath] = Object.keys(editorRow ?? {});
    return this.conditionFields().options.some((o) => o.id === fieldPath)
      ? editorRow
      : row;
  }
}

/** the options for the fields of the records linked in a link field ("link field › field") */
function linkedFieldOptions({
  linkId,
  link,
  fields,
}: LinkedTypeFields): FormFieldConfig[] {
  const linkLabel = resolveLocaleText(link.label) ?? linkId;
  return fieldOptions(fields).map((field) => ({
    ...field,
    id: `${linkId}.${field.id}`,
    label: `${linkLabel} › ${field.label}`,
    // the values of all linked records
    isArray: !!link.isArray || !!field.isArray,
  }));
}
