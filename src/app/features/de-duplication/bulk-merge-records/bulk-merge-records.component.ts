import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
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
import { AbstractControl, ReactiveFormsModule } from "@angular/forms";
import { MatError } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";

type MergeField = FormFieldConfig & { allowsMultiValueMerge: boolean };

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
    MatDialogClose,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  fieldsToMerge: MergeField[] = [];
  mergeForm: EntityForm<E>;

  /**
   * holds for each fieldId an array of selected values from existing entities,
   * used to show radio buttons in the UI
   */
  selectedValues: Record<string, any[]> = {};

  /** whether the entitiesToMerge contain some file attachments that would be lost during a merge */
  hasDiscardedFileOrPhoto: boolean = false;

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
    this.initFieldsToMerge();
    this.mergeForm = await this.entityFormService.createEntityForm(
      this.fieldsToMerge,
      this.mergedEntity,
    );
  }

  private initFieldsToMerge(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      const hasValue = this.entitiesToMerge.some(
        (entity) =>
          entity[key] !== undefined &&
          entity[key] !== null &&
          !(Array.isArray(entity[key]) && entity[key].length === 0),
      );
      const isFileField =
        field.dataType === "photo" || field.dataType === "file";

      if (isFileField && this.entitiesToMerge[1][key] != null) {
        this.hasDiscardedFileOrPhoto = true;
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

    // Toggle selection for multi-value fields
    if (fieldConfig.allowsMultiValueMerge) {
      this.selectedValues[fieldKey] = this.toggleSelection(
        this.selectedValues[fieldKey] ?? [],
        selectedValue,
      );
    } else {
      this.selectedValues[fieldKey] = [selectedValue];
    }

    // Ensure preview and UI stay in sync
    this.updateMergeFormField(fieldKey, fieldConfig);
  }

  private updateMergeFormField(
    fieldKey: string,
    fieldConfig: MergeField,
  ): void {
    const control = this.mergeForm.formGroup.get(fieldKey);
    if (!control) return;

    const selectedValues = this.selectedValues[fieldKey] ?? [];
    this.meregePreviewFieldChanges(control, fieldKey, fieldConfig);

    let value = selectedValues[0]; // default to single value
    if (fieldConfig.isArray) {
      // field type supports multiple values anyway
      value = selectedValues.flat();
    } else if (fieldConfig.allowsMultiValueMerge) {
      // create a merged single value as a convenience functionality for the merge UI
      value = selectedValues.join(", ");
    }

    control.patchValue(value);
  }

  private meregePreviewFieldChanges(
    control: AbstractControl,
    fieldKey: string,
    fieldConfig: MergeField,
  ): void {
    control.valueChanges.subscribe((newValue) => {
      const currentSelectedValues = this.selectedValues[fieldKey] || [];
      let computedValue: any;

      if (fieldConfig.allowsMultiValueMerge) {
        computedValue = fieldConfig.isArray
          ? currentSelectedValues.flat()
          : currentSelectedValues.join(", ");
      } else {
        computedValue = currentSelectedValues[0];
      }

      if (JSON.stringify(newValue) !== JSON.stringify(computedValue)) {
        this.selectedValues[fieldKey] = this.getUpdatedSelectedValues(
          fieldKey,
          newValue,
          fieldConfig,
        );
      }
    });
  }

  private getUpdatedSelectedValues(
    fieldKey: string,
    newValue: any,
    fieldConfig: MergeField,
  ): any[] {
    const newSelectedValues = [];

    for (const entity of this.entitiesToMerge) {
      const entityValue = entity[fieldKey];

      if (fieldConfig.isArray) {
        if (Array.isArray(entityValue) && Array.isArray(newValue)) {
          if (entityValue.some((v) => newValue.includes(v))) {
            newSelectedValues.push(entityValue);
          }
        }
      } else {
        const entityStr = entityValue?.toString() || "";
        const newValueArr = fieldConfig.allowsMultiValueMerge
          ? newValue.split(",").map((s) => s.trim())
          : [newValue];

        if (
          entityStr
            .split(",")
            .map((s) => s.trim())
            .some((v) => newValueArr.includes(v))
        ) {
          newSelectedValues.push(entityValue);
        }
      }
    }

    return newSelectedValues;
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
    const entityValue = this.entitiesToMerge[entityIndex][fieldKey];
    const selected = this.selectedValues[fieldKey] || [];
    return selected.some(
      (selectedValue) =>
        JSON.stringify(selectedValue) === JSON.stringify(entityValue),
    );
  }

  async confirmAndMergeRecords(): Promise<boolean> {
    this.mergeForm.formGroup.markAllAsTouched();
    if (this.mergeForm.formGroup.invalid) return false;

    if (this.hasDiscardedFileOrPhoto) {
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

    this.dialogRef.close(
      Object.assign(
        this.entitiesToMerge[0].copy(),
        this.mergeForm.formGroup.value,
      ),
    );
  }
}
