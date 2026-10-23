import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
  computed,
} from "@angular/core";
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
import {
  EntitySchemaField,
  WithinParentConfig,
} from "app/core/entity/schema/entity-schema-field";
import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { DateRangeDatatype } from "app/core/basic-datatypes/date-range/date-range.datatype";
import { asArray } from "app/utils/asArray";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { EditDateComponent } from "../../../../basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "../../../../basic-datatypes/month/edit-month/edit-month.component";

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
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent {
  private fb = inject(FormBuilder);
  private readonly entityRegistry = inject(EntityRegistry);

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  entitySchemaField = input.required<EntitySchemaField>();

  /** the record type of the field, to offer the date ranges of the records it links to */
  entityType = input<EntityConstructor>();

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

  withinParentControl = computed(
    () =>
      new FormControl<WithinParentConfig | null>(
        this.entitySchemaField()?.withinParent ?? null,
      ),
  );

  /**
   * The date ranges a date range field can be checked against:
   * each date range field of the record types that this record links to ("link field › date range field").
   */
  readonly parentRangeOptions = computed(() => {
    const field = this.entitySchemaField();
    const entityType = this.entityType();
    if (field?.dataType !== DateRangeDatatype.dataType || !entityType) {
      return [];
    }

    const options: { label: string; value: WithinParentConfig }[] = [];
    for (const [linkId, link] of entityType.schema) {
      if (link.dataType !== EntityDatatype.dataType) continue;
      for (const typeId of asArray(link.additional ?? [])) {
        if (!this.entityRegistry.has(typeId)) continue;
        const parentType = this.entityRegistry.get(typeId);
        if (parentType === entityType) {
          // the field itself (as the default), even if it is not saved to the schema yet
          options.push({
            label: `${link.label ?? linkId} › ${field.label || $localize`this field`}`,
            value: { parentReferenceField: linkId },
          });
        }
        for (const [valueId, parentField] of parentType.schema) {
          if (
            parentField.dataType !== DateRangeDatatype.dataType ||
            (parentType === entityType && valueId === field.id)
          ) {
            continue;
          }
          options.push({
            label: `${link.label ?? linkId} › ${parentField.label ?? valueId}`,
            value: { parentReferenceField: linkId, parentValueField: valueId },
          });
        }
      }
    }
    return options;
  });

  readonly isSameParentRange = (
    a: WithinParentConfig | null,
    b: WithinParentConfig | null,
  ) =>
    a?.parentReferenceField === b?.parentReferenceField &&
    a?.parentValueField === b?.parentValueField;

  validatorForm = computed(() => {
    const v = this.entitySchemaField()?.validators;
    const isObjectForm = typeof v?.pattern === "object";
    return this.fb.group({
      required: [v?.required ?? false],
      min: [v?.min ?? null],
      max: [v?.max ?? null],
      minAge: [v?.minAge ?? null],
      maxAge: [v?.maxAge ?? null],
      minDate: [v?.minDate ?? null],
      maxDate: [v?.maxDate ?? null],
      pattern: [
        (isObjectForm ? v.pattern.pattern : v?.pattern) ?? "",
        validRegexValidator,
      ],
      patternMessage: [(isObjectForm ? v.pattern.message : "") ?? ""],
      uniqueId: [v?.uniqueId ?? ""],
      readonlyAfterSet: [v?.readonlyAfterSet ?? false],
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
      const sub = form.valueChanges.subscribe(() => {
        const rawValues = form.getRawValue();
        this.transformPatternValue(rawValues);
        const cleanedValues =
          this.removeDefaultValuesFromValidatorConfig(rawValues);
        this.entityValidatorChanges.emit(cleanedValues);
      });
      onCleanup(() => {
        patternSub.unsubscribe();
        sub.unsubscribe();
      });
    });

    effect((onCleanup) => {
      const ctrl = this.trimControl();
      const sub = ctrl.valueChanges.subscribe((value: boolean) => {
        this.entitySchemaFieldChanges.emit({ trim: value });
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const ctrl = this.trimControl();
      const sub = ctrl.valueChanges.subscribe((value: boolean) => {
        this.entitySchemaFieldChanges.emit({ trim: value });
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const sub = this.withinParentControl().valueChanges.subscribe((value) =>
        this.entitySchemaFieldChanges.emit({
          withinParent: value ?? undefined,
        }),
      );
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

  isDateLikeValidatorType = computed(() => {
    return ["date", "date-only", "date-with-age", "month"].includes(
      this.entitySchemaField()?.dataType,
    );
  });

  isStringType = computed(() => {
    return ["string", "long-text"].includes(this.entitySchemaField()?.dataType);
  });

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

  isDateWithAgeType = computed(() => {
    return this.entitySchemaField()?.dataType === "date-with-age";
  });

  isMonthType = computed(() => {
    return this.entitySchemaField()?.dataType === "month";
  });

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
      if (isDefaultValue(validators[key])) {
        delete validators[key];
      }
    }

    function isDefaultValue(value): boolean {
      return value === false || value === "" || value === null;
    }

    return validators;
  }
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
