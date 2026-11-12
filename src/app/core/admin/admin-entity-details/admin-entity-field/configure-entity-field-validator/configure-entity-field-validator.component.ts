import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
  computed,
  signal,
  untracked,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntityConstructor } from "app/core/entity/model/entity";
import {
  EntityRelationsService,
  LinkedTypeFields,
} from "app/core/entity/entity-mapper/entity-relations.service";
import { DateRangeDatatype } from "app/core/basic-datatypes/date-range/date-range.datatype";
import { resolveLocaleText } from "app/core/language/active-locale";
import {
  FormValidatorConfig,
  WARNING_ONLY_KEY,
  WithinParentConfig,
} from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { DynamicValidatorsService } from "app/core/common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { MonthDatatype } from "app/core/basic-datatypes/month/month.datatype";
import { StringDatatype } from "app/core/basic-datatypes/string/string.datatype";
import { asArray } from "app/utils/asArray";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { EditDateComponent } from "../../../../basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "../../../../basic-datatypes/month/edit-month/edit-month.component";
import { AdminDisplayConditionButtonComponent } from "../../../building-blocks/admin-display-condition-button/admin-display-condition-button.component";

/** an option of the date ranges a date range field can be checked against */
interface ParentRangeOption {
  label: string;
  value: WithinParentConfig;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-configure-entity-field-validator",
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    HelpButtonComponent,
    EditDateComponent,
    EditMonthComponent,
    MatSelectModule,
    AdminDisplayConditionButtonComponent,
    NgTemplateOutlet,
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent {
  private fb = inject(FormBuilder);
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly validators = inject(DynamicValidatorsService);
  private readonly schemaService = inject(EntitySchemaService);

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  entitySchemaField = input.required<EntitySchemaField>();

  /** the record type of the field, to offer the date ranges of the records it links to */
  entityType = input<EntityConstructor>();

  /**
   * the data type currently selected for the field, if it can change while editing
   * (a change of `entitySchemaField.dataType` in place is not noticed)
   */
  dataType = input<string>();

  protected readonly fieldDataType = computed(
    () => this.dataType() ?? this.entitySchemaField()?.dataType,
  );

  /**
   * the `additional` currently selected for the field (e.g. the record types of a link field), if it can change while editing
   * (a change of `entitySchemaField.additional` in place is not noticed)
   */
  additional = input<unknown>();

  /** keys of the validators that fit the data type selected for the field, so that their settings are shown */
  protected readonly applicableValidators = computed(() => {
    const datatype = this.schemaService.getDatatypeOrDefault(
      this.fieldDataType(),
    );
    const field = {
      ...this.entitySchemaField(),
      dataType: this.fieldDataType(),
      additional: this.additional() ?? this.entitySchemaField()?.additional,
    };
    return new Set(
      [...this.validators.rules.values()]
        .filter((rule) => rule.appliesTo(datatype, field))
        .map((rule) => rule.key),
    );
  });

  /** the current values of {@link validatorForm} */
  private readonly formValue = signal<FormValidatorConfig>({});

  /** keys of the validators that are set, so that they can be made only a warning */
  protected readonly setValidators = computed(
    () =>
      new Set(
        Object.entries(this.formValue())
          .filter(([, value]) => !isUnset(value))
          .map(([key]) => key),
      ),
  );

  /** keys of the validators that are only a warning */
  protected readonly warningOnlyValidators = computed(
    () => new Set(asArray(this.formValue()[WARNING_ONLY_KEY] ?? [])),
  );

  /**
   * the record type a link field links to, if it is exactly one (as needed for a `selectionCondition`);
   * it can change while editing the field, the parent then removes the `selectionCondition` from the field's validators
   */
  linkedEntityType = input<EntityConstructor>();

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  entityValidatorChanges = output<FormValidatorConfig>();

  /**
   * Emit changes to EntitySchemaField properties (e.g. trim) that are not validators.
   */
  entitySchemaFieldChanges = output<Partial<EntitySchemaField>>();

  trimControl = computed(
    () => new FormControl(this.entitySchemaField()?.trim !== false),
  );

  /**
   * The date ranges a date range field can be checked against:
   * each date range field of the record types that this record links to ("link field › date range field").
   */
  readonly parentRangeOptions = computed(() => {
    const field = this.entitySchemaField();
    const entityType = this.entityType();
    if (this.fieldDataType() !== DateRangeDatatype.dataType || !entityType) {
      return [];
    }

    return this.entityRelations
      .getFieldsOfLinkedTypes(entityType, DateRangeDatatype.dataType)
      .flatMap((linked) =>
        this.rangeOptionsOfLinkedType(linked, entityType, field),
      );
  });

  /** the date range fields of a record type that the link field links to ("link field › date range field") */
  private rangeOptionsOfLinkedType(
    { linkId, link, linkedType, fields }: LinkedTypeFields,
    entityType: EntityConstructor,
    field: EntitySchemaField,
  ): ParentRangeOption[] {
    const linkLabel = resolveLocaleText(link.label) ?? linkId;
    const isSameType = linkedType === entityType;
    const options: ParentRangeOption[] = [];
    if (isSameType) {
      // the field itself (as the default), even if it is not saved to the schema yet
      const thisField = resolveLocaleText(field.label) || $localize`this field`;
      options.push({
        label: `${linkLabel} › ${thisField}`,
        value: { parentReferenceField: linkId },
      });
    }
    for (const [valueId, parentField] of fields) {
      if (!(isSameType && valueId === field.id)) {
        options.push({
          label: `${linkLabel} › ${resolveLocaleText(parentField.label) ?? valueId}`,
          value: { parentReferenceField: linkId, parentValueField: valueId },
        });
      }
    }
    return options;
  }

  readonly isSameParentRange = (
    a: WithinParentConfig | null,
    b: WithinParentConfig | null,
  ) =>
    a?.parentReferenceField === b?.parentReferenceField &&
    a?.parentValueField === b?.parentValueField;

  validatorForm = computed(() => {
    // read again when the linked type changes, as the parent then removes the `selectionCondition`
    this.linkedEntityType();
    const v = this.entitySchemaField()?.validators;
    const pattern = v?.pattern;
    const isObjectForm =
      !!pattern && typeof pattern === "object" && !(pattern instanceof RegExp);
    let patternText = isObjectForm ? pattern.pattern : pattern;
    if (patternText instanceof RegExp) {
      patternText = patternText.source;
    }
    return this.fb.group({
      required: [v?.required ?? false],
      min: [v?.min ?? null],
      max: [v?.max ?? null],
      minAge: [v?.minAge ?? null],
      maxAge: [v?.maxAge ?? null],
      minDate: [v?.minDate ?? null],
      maxDate: [v?.maxDate ?? null],
      pattern: [patternText ?? "", validRegexValidator],
      patternMessage: [(isObjectForm ? pattern.message : "") ?? ""],
      uniqueId: [v?.uniqueId ?? ""],
      readonlyAfterSet: [v?.readonlyAfterSet ?? false],
      withinParent: [v?.withinParent ?? null],
      selectionCondition: [v?.selectionCondition ?? null],
      [WARNING_ONLY_KEY]: [asArray(v?.[WARNING_ONLY_KEY] ?? [])],
    });
  });

  constructor() {
    effect((onCleanup) => {
      const form = this.validatorForm();

      this.normalizeDateControl(form, "minDate");
      this.normalizeDateControl(form, "maxDate");
      this.syncPatternMessageAvailability(form);

      const patternSub = form
        .get("pattern")
        .valueChanges.subscribe(() =>
          this.syncPatternMessageAvailability(form),
        );
      this.formValue.set(form.getRawValue());
      const sub = form.valueChanges.subscribe(() => {
        this.formValue.set(form.getRawValue());
        this.entityValidatorChanges.emit(this.validatorConfig(form));
      });
      onCleanup(() => {
        patternSub.unsubscribe();
        sub.unsubscribe();
      });
    });

    // settings not fitting the selected type are not shown, so an invalid value in them must not block saving
    effect(() => {
      const form = this.validatorForm();
      const applicable = this.applicableValidators();
      untracked(() => {
        for (const [key, control] of Object.entries(form.controls)) {
          if (!this.validators.rules.has(key)) {
            continue;
          }
          if (applicable.has(key)) {
            control.enable({ emitEvent: false });
          } else {
            control.disable({ emitEvent: false });
          }
        }
        this.syncPatternMessageAvailability(form);
      });
    });

    // settings not fitting a newly selected type are not shown, so they are removed from the config right away
    let shownDataType: string | undefined;
    let firstRun = true;
    effect(() => {
      const dataType = this.fieldDataType();
      untracked(() => {
        if (!firstRun && dataType !== shownDataType) {
          this.entityValidatorChanges.emit(
            this.validatorConfig(this.validatorForm()),
          );
          const keepsNoTrim =
            dataType === StringDatatype.dataType &&
            this.trimControl().value === false;
          this.entitySchemaFieldChanges.emit({
            trim: keepsNoTrim ? false : undefined,
          });
        }
        firstRun = false;
        shownDataType = dataType;
      });
    });

    effect((onCleanup) => {
      const ctrl = this.trimControl();
      const sub = ctrl.valueChanges.subscribe((value: boolean) => {
        this.entitySchemaFieldChanges.emit({ trim: value });
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  /**
   * The custom validation error text is only meaningful together with a pattern,
   * so the input is disabled while no pattern is entered.
   */
  private syncPatternMessageAvailability(form: FormGroup) {
    const messageControl = form.get("patternMessage");
    const patternControl = form.get("pattern");
    if (patternControl.enabled && patternControl.value) {
      messageControl.enable({ emitEvent: false });
    } else {
      messageControl.disable({ emitEvent: false });
    }
  }

  setWarningOnly(key: string, warningOnly: boolean) {
    const control = this.validatorForm().get(WARNING_ONLY_KEY);
    const others = control.value.filter((other: string) => other !== key);
    control.setValue(warningOnly ? [...others, key] : others);
  }

  /**
   * The validators config of the form:
   * the set validators fitting the selected data type (see {@link removeDefaultValuesFromValidatorConfig}),
   * the keys of the config without a setting here (e.g. of other modules) kept as they are.
   */
  private validatorConfig(form: FormGroup): FormValidatorConfig {
    const values = form.getRawValue();
    this.transformPatternValue(values);
    const notInForm = Object.entries(
      this.entitySchemaField()?.validators ?? {},
    ).filter(([key]) => !(key in form.controls));
    const config: FormValidatorConfig = {
      ...Object.fromEntries(notInForm),
      ...this.removeDefaultValuesFromValidatorConfig(values),
    };
    const applicable = this.applicableValidators();
    for (const key of Object.keys(config)) {
      if (this.validators.rules.has(key) && !applicable.has(key)) {
        delete config[key];
      }
    }

    const warningOnly = asArray(config[WARNING_ONLY_KEY] ?? []).filter(
      (key) =>
        key in config && this.validators.rules.get(key)?.warning === "optional",
    );
    delete config[WARNING_ONLY_KEY];
    if (warningOnly.length > 0) {
      config[WARNING_ONLY_KEY] = warningOnly;
    }
    return config;
  }

  /**
   * Replaces the raw pattern and patternMessage inputs with a config value for the "pattern" validator:
   * drops it if the pattern is empty or not a compilable regex,
   * uses the object form { pattern, message } if a custom error message is entered.
   */
  private transformPatternValue(
    values: FormValidatorConfig & { patternMessage?: string },
  ) {
    const newPattern = values.pattern;
    const message = values.patternMessage;
    delete values.patternMessage;

    if (!newPattern || !isValidRegex(newPattern)) {
      delete values.pattern;
      return;
    }

    if (message) {
      values.pattern = { pattern: newPattern, message };
    }
  }

  isMonthType = computed(() => this.fieldDataType() === MonthDatatype.dataType);

  private normalizeDateControl(form: FormGroup, controlName: string): void {
    const ctrl = form.get(controlName);
    const val = ctrl?.value;
    if (typeof val === "string" || typeof val === "number") {
      const parsed = new Date(val as any);
      if (!Number.isNaN(parsed.getTime())) {
        ctrl?.setValue(parsed, { emitEvent: false });
      }
    }
  }

  /**
   * Removes default fields and returns a validator config that only contains explicitly activated validators.
   * @param validators form values including default values that are unchanged
   */
  removeDefaultValuesFromValidatorConfig(
    validators: FormValidatorConfig,
  ): FormValidatorConfig {
    for (let key of Object.keys(validators)) {
      if (isUnset(validators[key])) {
        delete validators[key];
      }
    }
    return validators;
  }
}

/** whether a validator's form control value means it is not set */
function isUnset(value: unknown): boolean {
  return (
    value === false ||
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Marks the control as invalid if its value cannot be compiled as a regular expression.
 */
function validRegexValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!control.value || isValidRegex(control.value)) {
    return null;
  }
  return { invalidPattern: true };
}
