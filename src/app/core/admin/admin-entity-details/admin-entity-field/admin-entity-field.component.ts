import {
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  Signal,
  signal,
  viewChild,
  WritableSignal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { MatTabsModule } from "@angular/material/tabs";
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AdminDisplayConditionButtonComponent } from "../../building-blocks/admin-display-condition-button/admin-display-condition-button.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { ConfigurableEnumService } from "../../../basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { ConfigureEnumPopupComponent } from "../../../basic-datatypes/configurable-enum/configure-enum-popup/configure-enum-popup.component";
import { ConfigurableEnum } from "../../../basic-datatypes/configurable-enum/configurable-enum";
import { EntityConfigService } from "../../../entity/entity-config.service";
import { TranslatableTextInputComponent } from "../../../config/translatable-text-input/translatable-text-input.component";
import { TranslatableText } from "../../../config/multi-lingual-config";
import {
  mergeLocaleTranslations,
  resolveLocaleText,
} from "../../../language/active-locale";
import { generateIdFromLabel } from "../../../../utils/generate-id-from-label/generate-id-from-label";
import { merge } from "rxjs";
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
} from "rxjs/operators";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { uniquePropertyValidator } from "app/core/common-components/entity-form/unique-property-validator/unique-property-validator";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator/configure-entity-field-validator.component";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { AnonymizeOptionsComponent } from "./anonymize-options/anonymize-options.component";
import { MatCheckbox, MatCheckboxChange } from "@angular/material/checkbox";
import { AdminDefaultValueComponent } from "../../../default-values/admin-default-value/admin-default-value.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { AdminSearchableCheckboxComponent } from "./admin-searchable-checkbox/admin-searchable-checkbox.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { YesNoButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { AttendanceDatatype } from "#src/app/features/attendance/model/attendance.datatype";
import { asArray } from "app/utils/asArray";
import { DateRangeDatatype } from "../../../basic-datatypes/date-range/date-range.datatype";
import { DateRangeFilterConfigOption } from "../../../entity-list/EntityListConfig";

/**
 * Dialog data for AdminEntityFieldComponent
 */
export interface AdminEntityFieldData {
  /** current state of the field being edited */
  entitySchemaField: EntitySchemaField;

  /**
   * Entity type this field is part of,
   * to use as context information.
   * The entityType is not changed by this component.
   */
  entityType: EntityConstructor;

  /**
   * Whether the field is changed only for a single view instead of globally for the entity type.
   * Use to prevent changes to config that are required to be consistent across all uses of the field.
   */
  overwriteLocally: boolean;
}

/**
 * Allows configuration of the schema of a single Entity field, like its dataType and labels.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-entity-field",
  templateUrl: "./admin-entity-field.component.html",
  styleUrls: [
    "./admin-entity-field.component.scss",
    "../../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  imports: [
    MatDialogModule,
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    FormsModule,
    MatTabsModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    AdminDisplayConditionButtonComponent,
    BasicAutocompleteComponent,
    ConfigureEntityFieldValidatorComponent,
    AnonymizeOptionsComponent,
    MatCheckbox,
    AdminDefaultValueComponent,
    EntityTypeSelectComponent,
    AdminSearchableCheckboxComponent,
    TranslatableTextInputComponent,
  ],
})
export class AdminEntityFieldComponent implements OnInit {
  data = inject<AdminEntityFieldData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private fb = inject(FormBuilder);
  private allDataTypes = inject(DefaultDatatype);
  private configurableEnumService = inject(ConfigurableEnumService);
  private entityRegistry = inject(EntityRegistry);
  private dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly entityConfigService = inject(EntityConfigService);
  private readonly labelValue = signal<TranslatableText | undefined>(undefined);

  /** the label text of the active language, for display outside the form field */
  readonly resolvedLabel = computed(
    () => resolveLocaleText(this.labelValue()) ?? "",
  );

  private readonly validatorConfig = viewChild(
    ConfigureEntityFieldValidatorComponent,
  );

  fieldId: string;
  entityType: EntityConstructor;

  form: FormGroup;
  fieldIdForm: FormControl;

  /** form group of all fields in EntitySchemaField (i.e. without fieldId) */
  schemaFieldsForm: FormGroup;
  additionalForm: FormControl;
  typeAdditionalOptions: SimpleDropdownValue[] = [];
  dataTypes: SimpleDropdownValue[] = [];
  entityAdditionalMultiSelect: WritableSignal<boolean> = signal(false);
  attendanceParticipantTypesForm = new FormControl<string[]>([]);

  /** whether a "date-range" field offers predefined periods (`additional` is not an empty list) */
  datePresetsOffered: WritableSignal<boolean> = signal(true);
  /** the periods that were configured for the field, to offer them again after they were switched off */
  private customDatePresets: DateRangeFilterConfigOption[] | undefined;

  /**
   * dataTypes for which a field can hold multiple values (`isArray`),
   * so that the "allow multiple values" option is offered to the user.
   */
  private static readonly MULTI_VALUE_DATATYPES: string[] = [
    ConfigurableEnumDatatype.dataType,
    EntityDatatype.dataType,
  ];

  ngOnInit() {
    this.entityType = this.data.entityType;
    this.initSettings();

    if (this.data.overwriteLocally) {
      this.lockGlobalFields();
    }

    // Auto-generate ID if not yet set
    if (!this.data.entitySchemaField.id) {
      this.autoGenerateId();
    }
    this.initAvailableDatatypes(
      this.allDataTypes as unknown as DefaultDatatype<any, any>[],
    );
  }

  /**
   * Disable editing of those fields that have to be consistent across all uses of the field.
   * @private
   */
  private lockGlobalFields() {
    ["dataType", "additional", "isArray"].forEach((ctrlName) => {
      const control = this.schemaFieldsForm.get(ctrlName);
      if (control?.value) {
        control.disable();
      }
    });
  }

  private initSettings() {
    this.fieldIdForm = this.fb.control(this.data.entitySchemaField.id, {
      validators: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9_]*$/),
      ],
      asyncValidators: [
        uniquePropertyValidator({
          getExistingValues: async () =>
            Array.from(this.data.entityType.schema.keys()),
          normalize: true,
          fieldLabel: $localize`:field label:id`,
        }),
      ],
    });
    this.additionalForm = this.fb.control(
      this.data.entitySchemaField.additional,
    );

    const labelFormControl = this.fb.control(
      // the raw value (plain string or per-language map) - the input component
      // displays only the active language of it
      this.rawSchemaValue("label"),
      {
        validators: [Validators.required],
        asyncValidators: [
          uniquePropertyValidator({
            getExistingValues: async () => {
              const labels: TranslatableText[] = [];
              for (const [
                key,
                field,
              ] of this.data.entityType.schema.entries()) {
                if (key === this.data.entitySchemaField.id) continue;
                if (field.label) {
                  labels.push(field.label);
                }
              }
              return labels;
            },
            normalize: true,
            fieldLabel: $localize`:field label:label`,
          }),
        ],
      },
    );

    this.schemaFieldsForm = this.fb.group({
      id: this.fieldIdForm,
      label: labelFormControl,
      labelShort: [this.rawSchemaValue("labelShort")],
      displayFullLengthLabel: [
        this.data.entitySchemaField.displayFullLengthLabel ?? false,
      ],
      displayFullLengthOptionLabel: [
        this.data.entitySchemaField.displayFullLengthOptionLabel ?? false,
      ],
      description: [this.rawSchemaValue("description")],

      dataType: [this.data.entitySchemaField.dataType, Validators.required],
      isArray: [this.data.entitySchemaField.isArray],
      additional: this.additionalForm,

      defaultValue: new FormControl(this.data.entitySchemaField.defaultValue),
      searchable: [this.data.entitySchemaField.searchable],
      anonymize: [this.data.entitySchemaField.anonymize],
      viewComponent: [this.data.entitySchemaField.viewComponent],
      editComponent: [this.data.entitySchemaField.editComponent],
      showInDetailsView: [this.data.entitySchemaField.showInDetailsView],
      generateIndex: [this.data.entitySchemaField.generateIndex],
      validators: [this.data.entitySchemaField.validators],
      displayCondition: [this.data.entitySchemaField.displayCondition],
      selectionCondition: [this.data.entitySchemaField.selectionCondition],
    });
    this.form = this.fb.group({
      id: this.fieldIdForm,
      schemaFields: this.schemaFieldsForm,
    });

    const labelControl = this.schemaFieldsForm.get("label");
    this.labelValue.set(labelControl.value);
    labelControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.labelValue.set(value));

    this.schemaFieldsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValues) => this.updateSchemaFieldFromForm(formValues));

    this.schemaFieldsForm
      .get("labelShort")
      .valueChanges.pipe(
        filter((v) => v === ""),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((v) => {
        // labelShort should never be empty string, in that case it has to be removed so that label works as fallback
        this.schemaFieldsForm.get("labelShort").setValue(null);
      });
    // Sync attendance participant type selection back to additionalForm in nested format
    this.attendanceParticipantTypesForm.valueChanges
      .pipe(
        filter(
          () => this.schemaFieldsForm.get("dataType").value === "attendance",
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((types) => {
        this.additionalForm.setValue(this.buildAttendanceAdditional(types));
      });

    this.updateDataTypeAdditional(this.schemaFieldsForm.get("dataType").value);
    this.schemaFieldsForm
      .get("dataType")
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this.updateDataTypeAdditional(v);
        this.resetIsArrayIfUnsupported(v);
      });
    this.updateForNewOrExistingField();
    this.initSelectionConditionTarget();
  }

  /**
   * The record type this field references, if a `selectionCondition` can be applied to the field
   * (and the admin can therefore configure one).
   */
  selectionConditionTargetType: Signal<EntityConstructor | undefined>;

  private initSelectionConditionTarget() {
    const targetType$ = merge(
      this.additionalForm.valueChanges,
      this.schemaFieldsForm.get("dataType").valueChanges,
    ).pipe(
      startWith(null),
      map(() => this.getSelectionConditionTargetType()),
      distinctUntilChanged(),
    );
    this.selectionConditionTargetType = toSignal(targetType$, {
      injector: this.injector,
    });

    // a condition refers to fields of the previous target and would otherwise stay (invisible) in the config
    targetType$
      .pipe(pairwise(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.schemaFieldsForm.get("selectionCondition").setValue(null),
      );
  }

  private updateSchemaFieldFromForm(formValues) {
    if (
      JSON.stringify(formValues) === JSON.stringify(this.data.entitySchemaField)
    )
      return;

    for (const key of Object.keys(formValues)) {
      if (formValues[key] !== null) {
        this.data.entitySchemaField[key] = formValues[key];
      } else if (this.data.entitySchemaField.hasOwnProperty(key)) {
        // When field is cleared, delete the property
        delete this.data.entitySchemaField[key];
      }
    }
  }

  private updateForNewOrExistingField() {
    if (!!this.data.entitySchemaField.id) {
      // existing fields' id is readonly
      this.fieldIdForm.disable();
    } else {
      const autoGenerateSubscr = merge(
        this.schemaFieldsForm.get("label").valueChanges,
        this.schemaFieldsForm.get("labelShort").valueChanges,
      )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.autoGenerateId());
      // stop updating id when user manually edits
      this.fieldIdForm.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => autoGenerateSubscr.unsubscribe());
    }
  }

  entityFieldValidatorChanges(validatorData: FormValidatorConfig) {
    this.schemaFieldsForm.get("validators").setValue(validatorData);
  }

  onEntitySchemaFieldChanges(changes: Partial<EntitySchemaField>) {
    Object.assign(this.data.entitySchemaField, changes);
  }

  private autoGenerateId() {
    // prefer labelShort if it exists, as this makes less verbose IDs
    const label = resolveLocaleText(
      this.schemaFieldsForm.get("labelShort").value ??
        this.schemaFieldsForm.get("label").value,
    );
    const generatedId = generateIdFromLabel(label);
    this.fieldIdForm.setValue(generatedId, { emitEvent: false });
  }

  private initAvailableDatatypes(dataTypes: DefaultDatatype[]) {
    this.dataTypes = dataTypes
      .filter((d) => d.label !== DefaultDatatype.label) // hide "internal" technical dataTypes that did not define a human-readable label
      .map((d) => ({
        label: d.label,
        value: d.dataType,
      }));
  }

  /**
   * The record type this field references, if it is exactly one,
   * as required for a `selectionCondition`.
   */
  private getSelectionConditionTargetType(): EntityConstructor | undefined {
    if (
      this.schemaFieldsForm.get("dataType").value !== EntityDatatype.dataType
    ) {
      return undefined;
    }

    const types = asArray(this.additionalForm.value ?? []);
    if (types.length !== 1 || !this.entityRegistry.has(types[0])) {
      return undefined;
    }
    return this.entityRegistry.get(types[0]);
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.value;
  createNewAdditionalOption: (input: string) => SimpleDropdownValue;
  createNewAdditionalOptionAsync = async (input) =>
    this.createNewAdditionalOption(input);

  /**
   * Whether the user can choose to hold multiple values in one field of the given dataType,
   * i.e. whether the "allow multiple values" option is offered.
   */
  supportsMultiValue(dataType: string): boolean {
    return AdminEntityFieldComponent.MULTI_VALUE_DATATYPES.includes(dataType);
  }

  /**
   * Whether the dataType itself requires multiple values, independent of the user's choice
   * (see {@link DefaultDatatype.normalizeSchemaField}, e.g. "attendance").
   */
  private enforcesMultiValue(dataType: string): boolean {
    const datatype = (
      this.allDataTypes as unknown as DefaultDatatype<any, any>[]
    ).find((d) => d.dataType === dataType);
    return !!datatype?.normalizeSchemaField({ dataType })?.isArray;
  }

  /**
   * Remove the `isArray` flag if the newly selected dataType does not use multiple values.
   *
   * The "allow multiple values" checkbox is only displayed for some dataTypes.
   * Without this reset a previously set `isArray: true` silently remains in the config
   * (e.g. when a multi-select "configurable-enum" field is changed to "long-text"),
   * making the field's value an array that the dataType's display component cannot handle.
   */
  private resetIsArrayIfUnsupported(dataType: string) {
    if (this.supportsMultiValue(dataType) || this.enforcesMultiValue(dataType))
      return;

    const isArrayControl = this.schemaFieldsForm.get("isArray");
    if (!isArrayControl?.value) return;

    // `null` (rather than `false`) so that the flag is removed from the schema entirely
    isArrayControl.setValue(null);
  }

  private updateDataTypeAdditional(
    dataType: string,
    newAdditional: any = this.data.entitySchemaField.additional,
  ) {
    this.resetAdditional();

    if (dataType === ConfigurableEnumDatatype.dataType) {
      this.initAdditionalForEnum(
        typeof newAdditional === "string" ? newAdditional : undefined,
      );
    } else if (dataType === EntityDatatype.dataType) {
      this.initAdditionalForEntityRef(newAdditional);
    } else if (dataType === AttendanceDatatype.dataType) {
      this.initAdditionalForAttendance(newAdditional);
    } else if (dataType === DateRangeDatatype.dataType) {
      this.initAdditionalForDateRange(newAdditional);
    }

    // hasInnerType: [ArrayDatatype.dataType].includes(d.dataType),

    // TODO: this mapping of having an "additional" schema should probably become part of Datatype classes
  }

  private initAdditionalForEnum(newAdditional?: string) {
    this.typeAdditionalOptions = this.configurableEnumService
      .listEnums()
      .map((x) => ({
        label: Entity.extractEntityIdFromId(x), // TODO: add human-readable label to configurable-enum entities
        value: Entity.extractEntityIdFromId(x),
      }));
    this.additionalForm.addValidators(Validators.required);

    this.createNewAdditionalOption = (text) => ({
      value: generateIdFromLabel(text),
      label: text,
    });

    if (newAdditional) {
      this.additionalForm.setValue(newAdditional);
    } else if (this.schemaFieldsForm.get("label").value) {
      // when switching to enum datatype in the form, if unset generate a suggested enum-id immediately
      const newOption = this.createNewAdditionalOption(
        // resolve first: `generateIdFromLabel` returns undefined for a per-language map
        resolveLocaleText(this.schemaFieldsForm.get("label").value),
      );
      this.typeAdditionalOptions.push(newOption);
      this.additionalForm.setValue(newOption.value);
    }
  }

  private initAdditionalForEntityRef(newAdditional?: string | string[]) {
    this.additionalForm.addValidators(Validators.required);
    this.entityAdditionalMultiSelect.set(Array.isArray(newAdditional));

    if (Array.isArray(newAdditional)) {
      const validValues = newAdditional.filter((value) =>
        this.isValidEntityType(value),
      );
      this.additionalForm.setValue(validValues);
      return;
    }

    if (this.isValidEntityType(newAdditional)) {
      this.additionalForm.setValue(newAdditional);
    }
  }

  private resetAdditional() {
    this.additionalForm.removeValidators(Validators.required);
    this.additionalForm.reset(null);
    this.typeAdditionalOptions = [];
    this.createNewAdditionalOption = undefined;
    this.entityAdditionalMultiSelect.set(false);
    this.attendanceParticipantTypesForm.reset([]);
    this.datePresetsOffered.set(true);
    this.customDatePresets = undefined;
  }

  private initAdditionalForAttendance(newAdditional?: any) {
    // Extract participant types from the nested additional format
    let participantTypes: string[] = [];
    if (newAdditional?.participant?.additional) {
      const raw = newAdditional.participant.additional;
      participantTypes = Array.isArray(raw) ? [...raw] : [raw];
    }

    const validValues = participantTypes.filter((value) =>
      this.isValidEntityType(value),
    );

    if (validValues.length > 0) {
      this.additionalForm.setValue(this.buildAttendanceAdditional(validValues));
    }

    this.attendanceParticipantTypesForm.setValue(validValues);
  }

  private initAdditionalForDateRange(newAdditional?: unknown) {
    if (!Array.isArray(newAdditional)) {
      return;
    }
    this.additionalForm.setValue(newAdditional);
    this.datePresetsOffered.set(newAdditional.length > 0);
    this.customDatePresets =
      newAdditional.length > 0 ? newAdditional : undefined;
  }

  /** An empty list switches the predefined periods off, no value brings back the default (or the configured) ones. */
  onDatePresetsChange(change: MatCheckboxChange) {
    this.datePresetsOffered.set(change.checked);
    this.additionalForm.setValue(
      change.checked ? (this.customDatePresets ?? null) : [],
    );
  }

  private buildAttendanceAdditional(types: string[]): object | null {
    return types && types.length > 0
      ? { participant: { dataType: "entity", additional: types } }
      : null;
  }

  private isValidEntityType(type: string): boolean {
    return this.entityRegistry
      .getEntityTypes(true)
      .some((x) => x.value.ENTITY_TYPE === type);
  }

  async onEntityAdditionalSelectionModeChange(change: MatSlideToggleChange) {
    if (
      this.schemaFieldsForm.get("dataType")?.value !== EntityDatatype.dataType
    ) {
      change.source.checked = this.entityAdditionalMultiSelect();
      return;
    }

    const isMulti = change.checked;

    if (this.entityAdditionalMultiSelect() === isMulti) {
      return;
    }

    const currentValue = this.additionalForm.value;

    if (isMulti) {
      this.entityAdditionalMultiSelect.set(true);
      this.additionalForm.setValue(currentValue ? [currentValue] : []);
      return;
    }

    // Switching to single-select with 0 or 1 values - no confirmation needed
    if (!Array.isArray(currentValue) || currentValue.length <= 1) {
      this.entityAdditionalMultiSelect.set(false);
      this.additionalForm.setValue(
        Array.isArray(currentValue) ? (currentValue[0] ?? null) : null,
      );
      return;
    }

    // Switching to single-select with multiple values - ask for confirmation
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`:Entity field config switch mode title:Switch to single selection?`,
      $localize`:Entity field config switch mode body:You selected multiple target record types. Switching to single selection will clear this selection. Continue?`,
      YesNoButtons,
    );

    if (confirmed) {
      this.entityAdditionalMultiSelect.set(false);
      this.additionalForm.setValue(null);
    } else {
      // cancelled: reset the toggle and keep checked
      change.source.checked = true;
    }
  }

  async save() {
    this.form.markAllAsTouched();
    // Recalculates the value and validation status of the control, also updates the value and validity of its ancestors.
    this.schemaFieldsForm.updateValueAndValidity();

    // the validator settings sub-form is not part of `form`, so its validity is checked separately
    const validatorForm = this.validatorConfig()?.validatorForm();
    validatorForm?.markAllAsTouched();

    if (this.form.invalid || validatorForm?.invalid) return;
    this.data.entitySchemaField.id = this.fieldIdForm.getRawValue();
    this.dialogRef.close(this.data.entitySchemaField);
  }

  openEnumOptions(event: Event) {
    event.stopPropagation(); // do not open the autocomplete dropdown when clicking the settings icon

    let enumEntity = this.configurableEnumService.getEnum(
      this.additionalForm.value,
    );
    if (!enumEntity) {
      // if the user makes changes, the dialog component itself is saving the new entity to the database already
      enumEntity = new ConfigurableEnum(this.additionalForm.value);
    }
    this.dialog.open(ConfigureEnumPopupComponent, {
      data: enumEntity,
      disableClose: true,
    });
  }

  resetToBaseFieldSettings() {
    this.dialogRef.close(this.fieldIdForm.getRawValue());
  }
  /**
   * The raw, unresolved value of a schema field property, taken from the config
   * document so that all configured languages are available for editing.
   * The runtime schema only holds the text of the currently active language.
   */
  private rawSchemaValue(property: string): TranslatableText | undefined {
    const value = this.data.entitySchemaField[property];
    if (
      this.data.overwriteLocally &&
      value !==
        this.entityType.schema.get(this.data.entitySchemaField.id)?.[property]
    ) {
      // a text of this view's own field config, which is stored raw already.
      // Otherwise it is the global schema's text, resolved to the active language:
      // take it from the config document below, or saving this view would keep
      // only the admin's language of it
      return value;
    }

    const entityConfig = this.entityConfigService.getRawEntityConfig(
      this.entityType,
    );
    const rawValue =
      entityConfig?.attributes?.[this.data.entitySchemaField.id]?.[property];

    // The config document only has what was saved, the runtime schema also has the
    // edits applied on this page since. Combine them the way saving does: that keeps
    // the translations of other languages, but not an outdated text. A field that is
    // not in the config yet (newly added) has no raw value, so the schema's wins.
    return mergeLocaleTranslations(
      { [property]: rawValue },
      { [property]: this.data.entitySchemaField[property] },
    )[property];
  }
}
