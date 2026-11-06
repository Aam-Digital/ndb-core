import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
  computed,
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
import { asArray } from "app/utils/asArray";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { EditDateComponent } from "../../../../basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "../../../../basic-datatypes/month/edit-month/edit-month.component";
import { AdminDisplayConditionButtonComponent } from "../../../building-blocks/admin-display-condition-button/admin-display-condition-button.component";

/** the value of each validator's form control while it is not set */
const UNSET_VALUES: FormValidatorConfig = {
  required: false,
  min: null,
  max: null,
  minAge: null,
  maxAge: null,
  minDate: null,
  maxDate: null,
  pattern: "",
  uniqueId: "",
  readonlyAfterSet: false,
  withinParent: null,
};

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

  /** keys of the validators that fit the data type selected for the field */
  private readonly applicableValidators = computed(() => {
    const datatype = this.schemaService.getDatatypeOrDefault(
      this.fieldDataType(),
    );
    const field = {
      ...this.entitySchemaField(),
      dataType: this.fieldDataType(),
    };
    return new Set(
      this.validators
        .getRules()
        .filter((rule) => rule.appliesTo(datatype, field))
        .map((rule) => rule.key),
    );
  });

  /** the data type the validators were last shown for, to remove the ones not fitting a newly selected type */
  private shownDataType: string | undefined | null = null;

  /** settings were reset when the field was opened, so the config still has them until the form emits */
  private resetWithoutEmitting = false;

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
      const sub = form.valueChanges.subscribe(() =>
        this.entityValidatorChanges.emit(this.validatorConfig(form)),
      );
      onCleanup(() => {
        patternSub.unsubscribe();
        sub.unsubscribe();
      });
    });

    effect(() => {
      const form = this.validatorForm();
      const dataType = this.fieldDataType();
      const applicable = this.applicableValidators();
      untracked(() => {
        // the settings of validators not fitting the type are not shown, so they would stay in the config unnoticed
        const typeChanged =
          this.shownDataType !== null && this.shownDataType !== dataType;
        this.shownDataType = dataType;
        let reset = false;
        for (const [key, unset] of Object.entries(UNSET_VALUES)) {
          if (!applicable.has(key) && !isUnset(form.get(key).value)) {
            // only removed from the config when the admin changes something, not just by opening the field
            form.get(key).setValue(unset, { emitEvent: typeChanged });
            reset = true;
          }
        }
        if (reset) {
          this.syncPatternMessageAvailability(form);
        }
        if (!typeChanged) {
          this.resetWithoutEmitting ||= reset;
        } else if (this.resetWithoutEmitting) {
          this.resetWithoutEmitting = false;
          if (!reset) {
            form.updateValueAndValidity();
          }
        }
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
    if (form.get("pattern").value) {
      messageControl.enable({ emitEvent: false });
    } else {
      messageControl.disable({ emitEvent: false });
    }
  }

  /** whether the validator fits the data type selected for the field, so that its setting is shown */
  applies(key: string): boolean {
    return this.applicableValidators().has(key);
  }

  /** whether the validator is set, so that it can be made only a warning */
  hasValue(key: string): boolean {
    return !isUnset(this.validatorForm().get(key).value);
  }

  isWarningOnly(key: string): boolean {
    return this.validatorForm().get(WARNING_ONLY_KEY).value.includes(key);
  }

  setWarningOnly(key: string, warningOnly: boolean) {
    const control = this.validatorForm().get(WARNING_ONLY_KEY);
    const others = control.value.filter((other: string) => other !== key);
    control.setValue(warningOnly ? [...others, key] : others);
  }

  /**
   * The validators config of the form:
   * the set validators (see {@link removeDefaultValuesFromValidatorConfig}),
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

    const warningOnly = asArray(config[WARNING_ONLY_KEY] ?? []).filter(
      (key) =>
        key in config && this.validators.getRule(key)?.warning === "optional",
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

/** whether a validator's value means it is not set (see {@link UNSET_VALUES}) */
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
