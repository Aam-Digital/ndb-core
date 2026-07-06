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
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
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
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent {
  private fb = inject(FormBuilder);

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  entitySchemaField = input.required<EntitySchemaField>();

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  entityValidatorChanges = output<FormValidatorConfig>();

  validatorForm = computed(() => {
    const v = this.entitySchemaField()?.validators;
    const pattern =
      typeof v?.pattern === "object" ? v.pattern.pattern : v?.pattern;
    return this.fb.group({
      required: [v?.required ?? false],
      min: [v?.min ?? null],
      max: [v?.max ?? null],
      minAge: [v?.minAge ?? null],
      maxAge: [v?.maxAge ?? null],
      minDate: [v?.minDate ?? null],
      maxDate: [v?.maxDate ?? null],
      pattern: [pattern ?? "", validRegexValidator],
      uniqueId: [v?.uniqueId ?? ""],
      readonlyAfterSet: [v?.readonlyAfterSet ?? false],
    });
  });

  constructor() {
    effect((onCleanup) => {
      const form = this.validatorForm();

      this.normalizeDateControl(form, "minDate");
      this.normalizeDateControl(form, "maxDate");

      const sub = form.valueChanges.subscribe(() => {
        const rawValues = form.getRawValue();
        this.transformPatternValue(rawValues);
        const cleanedValues =
          this.removeDefaultValuesFromValidatorConfig(rawValues);
        this.entityValidatorChanges.emit(cleanedValues);
      });
      onCleanup(() => sub.unsubscribe());
    });
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
   * Replaces the raw pattern input with a config value for the "pattern" validator:
   * drops it if empty or not a compilable regex,
   * otherwise keeps a custom error message from the previously existing config.
   */
  private transformPatternValue(values: FormValidatorConfig) {
    const newPattern = values.pattern;
    if (!newPattern || !isValidRegex(newPattern)) {
      delete values.pattern;
      return;
    }

    const existing = this.entitySchemaField()?.validators?.pattern;
    if (typeof existing === "object" && existing.message) {
      values.pattern = { ...existing, pattern: newPattern };
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
