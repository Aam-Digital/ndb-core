import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { CommonModule } from "@angular/common";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";

@Component({
  selector: "app-configure-entity-field-validator",
  standalone: true,
  imports: [
    MatInputModule,
    FormsModule,
    MatCheckboxModule,
    CommonModule,
    ReactiveFormsModule,
    HelpButtonComponent,
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent implements OnInit {
  validatorForm: FormGroup;

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  @Input() entitySchemaField: EntitySchemaField;

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  @Output() entityValidatorChanges = new EventEmitter<FormValidatorConfig>();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.init();
  }

  private init() {
    if (this.entitySchemaField.validators) {
      this.validatorForm = this.fb.group({
        required: [this.entitySchemaField.validators.required],
        min: [this.entitySchemaField.validators.min],
        max: [this.entitySchemaField.validators.max],
        regex: [this.entitySchemaField.validators.pattern],
        validEmail: [this.entitySchemaField.validators.validEmail],
        uniqueId: [this.entitySchemaField.validators.uniqueId],
      });
    } else {
      this.validatorForm = this.fb.group({
        required: [false],
        min: [null],
        max: [null],
        regex: [""],
        validEmail: [false],
        uniqueId: [""],
      });
    }

    this.validatorForm.valueChanges.subscribe((value) => {
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
