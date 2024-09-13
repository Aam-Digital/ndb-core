import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "app/core/common-components/error-hint/error-hint.component";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { Entity, EntityConstructor } from "../../model/entity";
import { MatOption } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";
import {
  EntityForm,
  EntityFormService,
} from "app/core/common-components/entity-form/entity-form.service";

@Component({
  selector: "app-entity-bulk-edit",
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
    MatOption,
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    EntityFieldEditComponent,
  ],
  templateUrl: "./entity-bulk-edit.component.html",
  styleUrl: "./entity-bulk-edit.component.scss",
})
export class EntityBulkEditComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToEdit: E[];

  selectedFieldFormControl: FormControl;
  fieldValueForm: EntityForm<E>;

  /**
   * The available fields of the entity, from which the user can choose.
   */
  entityFields: Array<{ key: string; label: string; field: any }> = [];

  entityData: E;
  showValueForm: boolean = false;
  selectedField: FormFieldConfig;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entitiesToEdit: E[];
      entityConstructor: EntityConstructor;
    },
    private dialogRef: MatDialogRef<any>,
    private entityFormService: EntityFormService,
  ) {
    this.entityConstructor = data.entityConstructor;
    this.entityData = data.entitiesToEdit[0];
    this.entitiesToEdit = data.entitiesToEdit;
  }

  ngOnInit(): void {
    this.initForm();
    this.fetchEntityFieldsData();
  }

  private initForm() {
    this.selectedFieldFormControl = new FormControl("", Validators.required);
  }

  fetchEntityFieldsData() {
    this.entityFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([key, field]) => field.label)
      .map(([key, field]) => ({
        key: key,
        label: field.label,
        field: field,
      }));
  }

  async onChangeProperty(fieldId: string) {
    this.selectedField = this.entityFormService.extendFormFieldConfig(
      fieldId,
      this.entityConstructor,
    );

    this.fetchEntityFieldsData();

    const fieldKeys = this.entityFields.map((item) => item.key);
    await this.createEntityForm(fieldKeys);

    this.showValueForm = true;
  }

  private async createEntityForm(fieldKeys: string[]) {
    this.fieldValueForm = await this.entityFormService.createEntityForm(
      fieldKeys,
      this.entityData,
    );

    const selectedField = this.selectedFieldFormControl.value;
    if (this.fieldValueForm.formGroup.controls[selectedField]) {
      this.fieldValueForm.formGroup.controls[selectedField].setValue("");
    }
  }

  save() {
    this.selectedFieldFormControl.markAsTouched();
    if (this.selectedFieldFormControl.invalid) return;

    const selectedField = this.selectedFieldFormControl.value;
    const value =
      this.fieldValueForm?.formGroup.controls[selectedField]?.value || "";

    const returnValue: BulkEditAction = {
      selectedField,
      value,
    };
    this.dialogRef.close(returnValue);
  }
}

export interface BulkEditAction {
  selectedField: string;
  value: any;
}
