import { Component, OnChanges, SimpleChanges, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { v4 as uuid } from "uuid";
import { DialogCloseComponent } from "../../../../common-components/dialog-close/dialog-close.component";
import { FormFieldConfig } from "../../../../common-components/entity-form/FormConfig";

@Component({
  selector: "app-admin-edit-description-only-field",
  imports: [
    MatDialogModule,
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./admin-edit-description-only-field.component.html",
  styleUrl: "./admin-edit-description-only-field.component.scss",
})
export class AdminEditDescriptionOnlyFieldComponent implements OnChanges {
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private fb = inject(FormBuilder);

  formField: FormFieldConfig;
  schemaFieldsForm: FormGroup;

  constructor() {
    const data = inject<FormFieldConfig>(MAT_DIALOG_DATA);

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
      viewComponent: "DisplayDescriptionOnly",
      label: this.schemaFieldsForm.get("label").value,
    };

    this.dialogRef.close(newSchemaField);
  }
}
