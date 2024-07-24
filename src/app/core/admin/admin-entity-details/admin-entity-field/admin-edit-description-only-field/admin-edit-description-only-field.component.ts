import { Component, Inject, OnChanges, SimpleChanges } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../../common-components/error-hint/error-hint.component";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { v4 as uuid } from "uuid";
import { FormFieldConfig } from "../../../../common-components/entity-form/FormConfig";

@Component({
  selector: "app-admin-edit-description-only-field",
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    ErrorHintComponent,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./admin-edit-description-only-field.component.html",
  styleUrl: "./admin-edit-description-only-field.component.scss",
})
export class AdminEditDescriptionOnlyFieldComponent implements OnChanges {
  formField: FormFieldConfig;
  schemaFieldsForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: FormFieldConfig,
    private dialogRef: MatDialogRef<any>,
    private fb: FormBuilder,
  ) {
    this.formField = data;

    this.initSettings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entitySchemaField) {
      this.initSettings();
    }
  }

  public initSettings() {
    this.schemaFieldsForm = this.fb.group({
      label: [this.formField.label, Validators.required],
    });
  }

  save() {
    this.schemaFieldsForm.markAllAsTouched();
    if (this.schemaFieldsForm.invalid) {
      return;
    }
    if (!this.formField.id) {
      this.formField.id = uuid();
    }

    const newSchemaField = {
      id: this.formField.id,
      editComponent: "EditDescriptionOnly",
      label: this.schemaFieldsForm.get("label").value,
    };

    this.dialogRef.close(newSchemaField);
  }
}
