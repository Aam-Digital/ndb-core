import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogContent,
} from "@angular/material/dialog";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatRadioModule } from "@angular/material/radio";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import {
  EntityForm,
  EntityFormService,
} from "app/core/common-components/entity-form/entity-form.service";
import { ReactiveFormsModule } from "@angular/forms";
import { MatError } from "@angular/material/form-field";

@Component({
  selector: "app-bulk-merge-records",
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatRadioModule,
    MatButtonModule,
    CommonModule,
    EntityFieldViewComponent,
    EntityFieldEditComponent,
    ReactiveFormsModule,
    MatError,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  fieldsToMerge: FormFieldConfig[] = [];
  mergeForm: EntityForm<E>;
  selectedValues: Record<string, string[]> = {};
  hasFileOrPhoto: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
    },
    private dialogRef: MatDialogRef<BulkMergeRecordsComponent<E>>,
    private confirmationDialog: ConfirmationDialogService,
    private entityFormService: EntityFormService,
  ) {
    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.mergedEntity = data.entitiesToMerge[0].copy();
  }

  async ngOnInit(): Promise<void> {
    this.initializeMergeForm();
    this.mergeForm = await this.entityFormService.createEntityForm(
      this.fieldsToMerge,
      this.mergedEntity,
    );
  }

  private initializeMergeForm(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      const hasValue = this.entitiesToMerge.some(
        (entity) => entity[key] !== undefined && entity[key] !== null,
      );
      console.log(field, key);
      const isFileField =
        field.dataType === "photo" || field.dataType === "file";

      if (isFileField && this.entitiesToMerge[1][key] != null) {
        this.hasFileOrPhoto = true;
      }

      if (field.label && hasValue && !isFileField) {
        const formField: FormFieldConfig =
          this.entityFormService.extendFormFieldConfig(
            { id: key },
            this.entityConstructor,
          );
        this.fieldsToMerge.push(formField);
      }
    });
  }

  handleFieldSelection(fieldKey: string, entityIndex: 0 | 1): void {
    const selectedValue = this.entitiesToMerge[entityIndex][fieldKey];
    const fieldConfig = this.fieldsToMerge.find((f) => f.id === fieldKey);
    const isStringOrLongText = ["string", "long-text"].includes(
      fieldConfig?.dataType,
    );

    if (isStringOrLongText || fieldConfig?.isArray) {
      this.selectedValues[fieldKey] = this.selectedValues[fieldKey] ?? [];
      this.selectedValues[fieldKey] = this.toggleSelection(
        this.selectedValues[fieldKey],
        selectedValue,
      );

      if (fieldConfig?.isArray) {
        this.selectedValues[fieldKey] = [].concat(
          ...this.selectedValues[fieldKey],
        );
      }
    } else {
      this.selectedValues[fieldKey] = [selectedValue];
    }
    this.mergeForm.formGroup
      .get(fieldKey)
      ?.patchValue(
        fieldConfig?.isArray || isStringOrLongText
          ? this.selectedValues[fieldKey]
          : selectedValue,
      );
  }

  private toggleSelection(arr: any[], value: string): any[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  isFieldSelected(fieldKey: string, entityIndex: 0 | 1): boolean {
    return this.selectedValues[fieldKey]?.includes(
      this.entitiesToMerge[entityIndex][fieldKey],
    );
  }

  async confirmAndMergeRecords(): Promise<boolean> {
    this.mergeForm.formGroup.markAllAsTouched();
    if (this.mergeForm.formGroup.invalid) return false;

    Object.assign(this.mergedEntity, this.mergeForm.formGroup.value);

    let confirmationMessage = $localize`:Merge confirmation dialog: Merging of two records will permanently delete the data that is not merged. This action cannot be undone \n(Once the two records are merged, there will be only one record available in the system)`;

    if (this.hasFileOrPhoto) {
      confirmationMessage = $localize`:Merge confirmation dialog with files/photos: ${confirmationMessage} \n 'Record B contains files/photos. The merged record will be updated with the file/photos from the first record. Please take a moment to review the merged record.'`;
    }

    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title: Are you sure you want to merge this?`,
        confirmationMessage,
      ))
    ) {
      return false;
    }
    this.dialogRef.close(this.mergedEntity);
  }

  closeMergeDialog(): void {
    this.dialogRef.close();
  }
}
