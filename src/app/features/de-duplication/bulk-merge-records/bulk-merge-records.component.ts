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

    this.mergeForm.formGroup.valueChanges.subscribe((values) => {
      Object.assign(this.mergedEntity, values);
    });
  }

  private initializeMergeForm(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      const hasValue = this.entitiesToMerge.some(
        (entity) => entity[key] !== undefined && entity[key] !== null,
      );

      if (field.label && hasValue) {
        const formField: FormFieldConfig =
          this.entityFormService.extendFormFieldConfig(
            { id: key },
            this.entityConstructor,
          );
        this.fieldsToMerge.push(formField);
      } else {
        this.mergedEntity[key] = this.entitiesToMerge[0][key];
      }
    });
  }

  trackByFn(index: number, field: FormFieldConfig): string {
    return field.id;
  }

  handleFieldSelection(fieldKey: string, entityIndex: 0 | 1): void {
    const selectedValue = this.entitiesToMerge[entityIndex][fieldKey];
    const fieldConfig = this.fieldsToMerge.find((f) => f.id === fieldKey);

    if (
      fieldConfig?.dataType === "string" ||
      fieldConfig?.dataType === "entity"
    ) {
      this.selectedValues[fieldKey] ??= [];
      this.selectedValues[fieldKey] = this.toggleSelection(
        this.selectedValues[fieldKey],
        selectedValue,
      );

      if (fieldConfig?.dataType === "entity") {
        this.selectedValues[fieldKey] = this.selectedValues[fieldKey].flat();
      }

      this.mergeForm.formGroup
        .get(fieldKey)
        ?.patchValue(this.selectedValues[fieldKey] as any);
    } else {
      this.selectedValues[fieldKey] = [selectedValue];
      this.mergeForm.formGroup.get(fieldKey)?.patchValue(selectedValue);
    }
  }

  private toggleSelection(arr: any[], value: string): any[] {
    const index = arr.indexOf(value);
    return index === -1 ? [...arr, value] : arr.filter((_, i) => i !== index);
  }

  isFieldSelected(fieldKey: string, entityIndex: 0 | 1): boolean {
    return this.selectedValues[fieldKey]?.includes(
      this.entitiesToMerge[entityIndex][fieldKey],
    );
  }

  async confirmAndMergeRecords(): Promise<boolean> {
    this.mergeForm.formGroup.markAllAsTouched();
    if (this.mergeForm.formGroup.invalid) return;
    Object.assign(this.mergedEntity, this.mergeForm.formGroup.value);
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title: Are you sure you want to Merge this?`,
        $localize`:Merge confirmation dialog: Merging of two records will permanently delete the data that is not merged. This action cannot be undone \n(Once the two records are merged, there will be only one record available in the system)`,
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
