import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
} from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { EditDateComponent } from "../../../../basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "../../../../basic-datatypes/month/edit-month/edit-month.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription } from "rxjs";

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
  private readonly destroyRef = inject(DestroyRef);
  private formValueChangesSubscription?: Subscription;

  validatorForm: FormGroup;

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  entitySchemaField = input.required<EntitySchemaField>();

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  entityValidatorChanges = output<FormValidatorConfig>();

  constructor() {
    effect(() => {
      this.entitySchemaField(); // Track changes
      this.init();
    });
  }

  get isDateLikeValidatorType(): boolean {
    return ["date", "date-only", "date-with-age", "month"].includes(
      this.entitySchemaField()?.dataType,
    );
  }

  get isDateWithAgeType(): boolean {
    return this.entitySchemaField()?.dataType === "date-with-age";
  }

  get isMonthType(): boolean {
    return this.entitySchemaField()?.dataType === "month";
  }

  private normalizeDateControl(controlName: string): void {
    const ctrl = this.validatorForm.get(controlName);
    const val = ctrl?.value;
    if (typeof val === "string" || typeof val === "number") {
      const parsed = new Date(val as any);
      if (!Number.isNaN(parsed.getTime())) {
        ctrl?.setValue(parsed, { emitEvent: false });
      }
    }
  }

  private init() {
    this.formValueChangesSubscription?.unsubscribe();

    if (this.entitySchemaField().validators) {
      this.validatorForm = this.fb.group({
        required: [this.entitySchemaField().validators.required],
        min: [this.entitySchemaField().validators.min],
        max: [this.entitySchemaField().validators.max],
        minAge: [this.entitySchemaField().validators.minAge],
        maxAge: [this.entitySchemaField().validators.maxAge],
        minDate: [this.entitySchemaField().validators.minDate],
        maxDate: [this.entitySchemaField().validators.maxDate],
        regex: [this.entitySchemaField().validators.pattern],
        uniqueId: [this.entitySchemaField().validators.uniqueId],
        readonlyAfterSet: [
          this.entitySchemaField().validators.readonlyAfterSet,
        ],
      });
    } else {
      this.validatorForm = this.fb.group({
        required: [false],
        min: [null],
        max: [null],
        minAge: [null],
        maxAge: [null],
        minDate: [null],
        maxDate: [null],
        regex: [""],
        uniqueId: [""],
        readonlyAfterSet: [false],
      });
    }

    // Normalize any string/timestamp date values to Date objects so EditDate component receives a Date
    this.normalizeDateControl("minDate");
    this.normalizeDateControl("maxDate");

    // Emit validator changes when form values change
    this.formValueChangesSubscription = this.validatorForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const rawValues = this.validatorForm.getRawValue();
        const cleanedValues =
          this.removeDefaultValuesFromValidatorConfig(rawValues);

        this.entityValidatorChanges.emit(cleanedValues);
      });
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
