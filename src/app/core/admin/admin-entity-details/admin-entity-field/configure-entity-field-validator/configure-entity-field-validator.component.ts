import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { calculateAge } from "app/utils/utils";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
    MatDatepickerModule,
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  validatorForm: FormGroup;

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  @Input() entitySchemaField: EntitySchemaField;

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  @Output() entityValidatorChanges = new EventEmitter<FormValidatorConfig>();

  ngOnInit() {
    this.init();
  }

  private init() {
    if (this.entitySchemaField.validators) {
      this.validatorForm = this.fb.group({
        required: [this.entitySchemaField.validators.required],
        min: [this.entitySchemaField.validators.min],
        max: [this.entitySchemaField.validators.max],
        minDate: [this.entitySchemaField.validators.minDate],
        maxDate: [this.entitySchemaField.validators.maxDate],
        minAge: [
          { value: this.entitySchemaField.validators.minAge, disabled: true },
        ],
        maxAge: [
          { value: this.entitySchemaField.validators.maxAge, disabled: true },
        ],
        regex: [this.entitySchemaField.validators.pattern],
        uniqueId: [this.entitySchemaField.validators.uniqueId],
        readonlyAfterSet: [this.entitySchemaField.validators.readonlyAfterSet],
      });
    } else {
      this.validatorForm = this.fb.group({
        required: [false],
        min: [null],
        max: [null],
        minDate: [null],
        maxDate: [null],
        minAge: [{ value: null, disabled: true }],
        maxAge: [{ value: null, disabled: true }],
        regex: [""],
        uniqueId: [""],
        readonlyAfterSet: [false],
      });
    }

    // Subscribe to date changes to update calculated age fields
    this.validatorForm
      .get("minDate")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => {
        const age = date ? calculateAge(date) : null;
        this.validatorForm.get("minAge")?.setValue(age, { emitEvent: false });
      });

    this.validatorForm
      .get("maxDate")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => {
        const age = date ? calculateAge(date) : null;
        this.validatorForm.get("maxAge")?.setValue(age, { emitEvent: false });
      });

    // Initialize age calculations on load
    this.updateAgesFromDates();

    // Emit validator changes when form values change
    this.validatorForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const rawValues = this.validatorForm.getRawValue();
        const cleanedValues =
          this.removeDefaultValuesFromValidatorConfig(rawValues);
        this.entityValidatorChanges.emit(cleanedValues);
      });
  }

  /**
   * Calculates and updates age fields based on current date field values
   */
  private updateAgesFromDates(): void {
    const minDate = this.validatorForm.get("minDate")?.value;
    const maxDate = this.validatorForm.get("maxDate")?.value;

    if (minDate) {
      this.validatorForm
        .get("minAge")
        ?.setValue(calculateAge(minDate), { emitEvent: false });
    }

    if (maxDate) {
      this.validatorForm
        .get("maxAge")
        ?.setValue(calculateAge(maxDate), { emitEvent: false });
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
