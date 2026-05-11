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
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { EditAgeComponent } from "../../../../basic-datatypes/date-with-age/edit-age/edit-age.component";
import { EditDateComponent } from "../../../../basic-datatypes/date/edit-date/edit-date.component";
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
    EditAgeComponent,
    EditDateComponent,
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
    if (this.entitySchemaField.validators) {
      this.validatorForm = this.fb.group({
        required: [this.entitySchemaField.validators.required],
        min: [this.entitySchemaField.validators.min],
        max: [this.entitySchemaField.validators.max],
        minDate: [this.entitySchemaField.validators.minDate],
        maxDate: [this.entitySchemaField.validators.maxDate],
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
        regex: [""],
        uniqueId: [""],
        readonlyAfterSet: [false],
      });
    }

    // Normalize any string/timestamp date values to Date objects so EditAge component receives a Date
    this.normalizeDateControl("minDate");
    this.normalizeDateControl("maxDate");

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
