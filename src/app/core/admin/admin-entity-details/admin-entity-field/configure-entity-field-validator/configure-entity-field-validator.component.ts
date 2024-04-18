import { Component, EventEmitter, Input, Output } from "@angular/core";

import { NgForOf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { DialogCloseComponent } from "../../../../common-components/dialog-close/dialog-close.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { EntityConstructor } from "../../../../entity/model/entity";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { DynamicValidator } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";

@Component({
  selector: "app-configure-entity-field-validator",
  standalone: true,
  imports: [
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    FormsModule,
    MatCheckboxModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureValidatorPopupComponent {
  fieldId: string;
  validatorForm: FormGroup;
  form: FormGroup;
  @Input() entityConstructor: EntityConstructor;
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
    this.form = this.fb.group({
      validatorForm: this.validatorForm,
    });
    this.form.valueChanges.subscribe((value) => {
      this.entityValidatorChanges.emit(this.validatorForm.getRawValue());
    });
  }
}
