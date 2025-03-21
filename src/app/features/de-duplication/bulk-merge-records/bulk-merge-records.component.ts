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
import { th } from "@faker-js/faker";

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
   * holds for each fieldId an array whether each existing entity is "selected" (i.e. included in the merge),
   * used to show radio buttons in the UI
   */
  existingFieldSelected: Record<string, boolean[]> = {};

  isFieldDisabled: Record<string, boolean[]> = {};
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
    for (let [key, control] of Object.entries(
      this.mergeForm.formGroup.controls,
    )) {
      this.existingFieldSelected[key] = [false, false];
      this.subscribeFieldChangesToUpdateSelectionMarkers(control, key);
    }
    this.setInitialMergedValues();
  }

  private initFieldsToMerge(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      const hasValue = this.entitiesToMerge.some((entity) =>
        this.hasValue(entity[key]),
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
  private setInitialMergedValues(): void {
    for (const field of this.fieldsToMerge) {
      const valueA = this.entitiesToMerge[0][field.id];
      const valueB = this.entitiesToMerge[1][field.id];
      this.isFieldDisabled[field.id] = this.entitiesToMerge.map(
        (entity) => !this.hasValue(entity[field.id]),
      );
      const control = this.mergeForm.formGroup.get(field.id);
      if (!control) continue;

      const mergedValue = this.setSmartSelectedValue(
        valueA,
        valueB,
        control.value,
      );
      control.setValue(mergedValue);
    }
  }

  /**
   * Determines the best value to use when merging two entity field values.
   * If both values are identical, it returns one of them.
   * If one value is empty while the other is not, it returns the non-empty value.
   * Otherwise, it retains the current form value.
   */
  private setSmartSelectedValue(
    valueA: any,
    valueB: any,
    currentValue: any,
  ): any {
    if (this.areValuesIdentical(valueA, valueB)) {
      return valueA;
    } else if (!this.hasValue(valueA) && this.hasValue(valueB)) {
      return valueB;
    } else if (!this.hasValue(valueB) && this.hasValue(valueA)) {
      return valueA;
    } else if (Array.isArray(valueA) || Array.isArray(valueB)) {
      return [
        ...(Array.isArray(valueA) ? valueA : []),
        ...(Array.isArray(valueB) ? valueB : []),
      ];
    }
    return currentValue;
  }

  private areValuesIdentical(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private allowsMultiValueMerge(field?: FormFieldConfig): boolean {
    return (
      field?.dataType === "string" ||
      field?.dataType === "long-text" ||
      field?.isArray
    );
  }

  /**
   * helper method to check whether a value is empty or has a valid value.
   */
  hasValue(value: any): boolean {
    return !(
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      value === false
    );
  }

  private subscribeFieldChangesToUpdateSelectionMarkers(
    control: AbstractControl,
    fieldKey: string,
  ): void {
    const fieldConfig = this.fieldsToMerge.find((f) => f.id === fieldKey);

    control.valueChanges.subscribe((newValue) => {
      for (let i = 0; i < this.entitiesToMerge.length; i++) {
        this.updateSelectedStatus(fieldConfig, newValue, i);
      }
    });
  }

  private updateSelectedStatus(
    fieldConfig: MergeField,
    newValue: any,
    entityIndex: number,
  ) {
    if (this.isFieldDisabled[fieldConfig.id][entityIndex]) {
      this.existingFieldSelected[fieldConfig.id][entityIndex] = false;
      return;
    }

    let isChecked: boolean;
    let existingEntityValue = this.entitiesToMerge[entityIndex][fieldConfig.id];

    if (fieldConfig.isArray) {
      // all existingEntityValues must be in newValue
      isChecked = existingEntityValue.every((e) =>
        (newValue ?? []).some((n) => JSON.stringify(n) === JSON.stringify(e)),
      );
    } else if (fieldConfig.allowsMultiValueMerge) {
      // string merge: text should be included in newValue
      isChecked = (newValue ?? ("" as string)).includes(existingEntityValue);
    } else {
      // single value fields
      isChecked =
        JSON.stringify(newValue) === JSON.stringify(existingEntityValue);
    }

    this.existingFieldSelected[fieldConfig.id][entityIndex] = isChecked;
  }

  /**
   * Apply a value from one of the existing entities to the merge preview
   * @param fieldKey
   * @param entityIndex
   * @returns
   */
  selectExistingValue(
    fieldKey: string,
    entityIndex: number,
    checked?: boolean,
  ): void {
    const control = this.mergeForm.formGroup.get(fieldKey);
    if (!control) return;
    const fieldConfig: MergeField = this.fieldsToMerge.find(
      (f) => f.id === fieldKey,
    );
    if (!fieldConfig) return;

    const existingValue = control.value;
    const selectedValue = this.entitiesToMerge[entityIndex][fieldKey];

    let newValue = selectedValue;
    if (fieldConfig.isArray) {
      newValue = this.getMergedArrayValue(
        existingValue,
        selectedValue,
        checked,
      );
    } else if (fieldConfig.allowsMultiValueMerge) {
      newValue = this.getMergedStringValue(
        existingValue,
        selectedValue,
        checked,
      );
    }

    control.patchValue(newValue);
  }

  private getMergedArrayValue(
    value: any[],
    selectedValue: any[],
    checked: boolean,
  ): any[] {
    value = value ?? [];
    if (checked) {
      value = value.concat(selectedValue);
    } else {
      value = value.filter((v) => !selectedValue.includes(v));
    }
    return value;
  }

  private getMergedStringValue(
    value: string,
    selectedValue: string,
    checked: boolean,
  ): string {
    if (checked) {
      value = (value?.length > 0 ? value + ", " : "") + selectedValue;
    } else {
      value = value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== selectedValue)
        .join(", ");
    }
    return value;
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
