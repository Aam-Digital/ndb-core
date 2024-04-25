import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { DynamicValidator } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
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
export class ConfigureEntityFieldValidatorComponent {
  validatorForm: FormGroup;
  @Input() entitySchemaField: EntitySchemaField;
  @Output() entityValidatorChanges = new EventEmitter<DynamicValidator>();
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
      this.entityValidatorChanges.emit(this.validatorForm.getRawValue());
    });
  }
}
