import {
  Component,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { EntityConstructor } from "../../../../entity/model/entity";
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
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EntitySchemaField } from "../../../../entity/schema/entity-schema-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminEntityService } from "../../../admin-entity.service";
import { v4 as uuid } from "uuid";

@Component({
  selector: "app-admin-entity-text",
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
  templateUrl: "./admin-entity-text.component.html",
  styleUrl: "./admin-entity-text.component.scss",
})
export class AdminEntityTextComponent implements OnChanges {
  @Input() fieldId: string;
  @Input() entityType: EntityConstructor;

  entitySchemaField: EntitySchemaField;
  fieldIdForm: FormControl;
  schemaFieldsForm: FormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      fieldId: string;
      entityType: EntityConstructor;
    },
    private dialogRef: MatDialogRef<any>,
    private fb: FormBuilder,
    private adminEntityService: AdminEntityService,
  ) {
    this.fieldId = data.fieldId;
    this.entityType = data.entityType;
    this.entitySchemaField = this.entityType.schema.get(this.fieldId) ?? {};

    this.initSettings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entitySchemaField) {
      this.initSettings();
    }
  }

  public initSettings() {
    this.schemaFieldsForm = this.fb.group({
      label: [this.entitySchemaField.label, Validators.required],
    });
  }

  save() {
    this.schemaFieldsForm.markAllAsTouched();
    if (this.schemaFieldsForm.invalid) {
      return;
    }
    const formValues = this.schemaFieldsForm.getRawValue();
    for (const key of Object.keys(formValues)) {
      if (formValues[key] === null) {
        delete formValues[key];
      }
    }
    if (!this.fieldId) {
      this.fieldId = uuid();
    }

    const updatedEntitySchema = Object.assign(
      { _isCustomizedField: true },
      {
        id: this.fieldId,
        editComponent: "EditDescriptionOnly",
        label: $localize`:description section:` + `${formValues.label}`,
      },
    );
    this.adminEntityService.updateSchemaField(
      this.entityType,
      this.fieldId,
      updatedEntitySchema,
    );

    this.dialogRef.close(this.fieldId);
  }
}
