import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
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
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
  selector: "app-bulk-merge-records",
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatRadioModule,
    MatButtonModule,
    CommonModule,
    MatCheckboxModule,
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
  fieldsToMerge: (FormFieldConfig & { allowsMultiValueMerge: boolean })[] = [];
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
    this.mergedEntity = new this.entityConstructor() as E;
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
        this.fieldsToMerge.push({
          ...formField,
          allowsMultiValueMerge: this.allowsMultiValueMerge(formField),
        });
      }
    });
  }

  handleFieldSelection(fieldKey: string, entityIndex: number): void {
    const selectedValue = this.entitiesToMerge[entityIndex][fieldKey];
    const fieldConfig = this.fieldsToMerge.find((f) => f.id === fieldKey);
    const isCheckbox = fieldConfig.allowsMultiValueMerge;

    this.selectedValues[fieldKey] = isCheckbox
      ? this.toggleSelection(this.selectedValues[fieldKey] ?? [], selectedValue)
      : [selectedValue];

    this.updateMergeFormField(fieldKey, fieldConfig, isCheckbox);
  }

  private updateMergeFormField(
    fieldKey: string,
    fieldConfig: FormFieldConfig,
    isCheckbox: boolean,
  ): void {
    const control = this.mergeForm.formGroup.get(fieldKey);
    if (!control) return;

    const value = isCheckbox
      ? this.getCheckboxValue(fieldKey, fieldConfig)
      : this.selectedValues[fieldKey][0];

    control.patchValue(value);
  }

  private getCheckboxValue(fieldKey: string, config: FormFieldConfig): any {
    const values = this.selectedValues[fieldKey] || [];
    return config.isArray ? values.flat() : values.join(", ");
  }

  private toggleSelection(arr: any[], value: string): any[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  allowsMultiValueMerge(field?: FormFieldConfig): boolean {
    return (
      field?.dataType === "string" ||
      field?.dataType === "long-text" ||
      field?.isArray
    );
  }

  isFieldSelected(fieldKey: string, entityIndex: number): boolean {
    return this.selectedValues[fieldKey]?.includes(
      this.entitiesToMerge[entityIndex][fieldKey],
    );
  }

  async confirmAndMergeRecords(): Promise<boolean> {
    this.mergeForm.formGroup.markAllAsTouched();
    if (this.mergeForm.formGroup.invalid) return false;
    this.mergedEntity = this.entitiesToMerge[0].copy();

    Object.assign(this.mergedEntity, this.mergeForm.formGroup.value);

    if (this.hasFileOrPhoto) {
      const fileIgnoreConfirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Warning! Some file attachments will be lost`,
        $localize`:Merge confirmation dialog with files/photos:"Record B" contains files or images. Merging currently does not support attachments yet. The merged record will only have the attachments from "record A". Files from "record B" will be lost!\nAre you sure you want to continue?`,
      );
      if (!fileIgnoreConfirmed) {
        return false;
      }
    }

    let confirmationMessage = $localize`:Merge confirmation dialog:Merging of two records will discard the data that is not selected to be merged. This action cannot be undone. Once the two records are merged, there will be only one record left in the system.\nAre you sure you want to continue?`;
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Are you sure you want to merge this?`,
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
