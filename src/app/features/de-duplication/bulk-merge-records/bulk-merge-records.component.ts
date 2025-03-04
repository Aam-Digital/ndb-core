import { Component, EventEmitter, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogContent,
} from "@angular/material/dialog";
import { FormGroup, FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatRadioModule } from "@angular/material/radio";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";

@Component({
  selector: "app-bulk-merge-records",
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
    CommonModule,
    EntityFieldViewComponent,
    EntityFieldEditComponent,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  fieldsToMerge: FormFieldConfig[] = [];
  mergeForm: FormGroup;
  selectedValues: Record<string, string[]> = {};

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
    },
    private dialogRef: MatDialogRef<BulkMergeRecordsComponent<E>>,
    private fb: FormBuilder,
    private confirmationDialog: ConfirmationDialogService,
    private entityFormService: EntityFormService,
  ) {
    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.mergedEntity = new this.entityConstructor() as E;
    this.mergeForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initializeMergeForm();
    this.mergeForm.valueChanges.subscribe((values) => {
      Object.entries(values).forEach(([key, value]) => {
        this.mergedEntity[key] = value;
      });
    });
  }

  private initializeMergeForm(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      if (field.label) {
        const formField: FormFieldConfig =
          this.entityFormService.extendFormFieldConfig(
            { id: key },
            this.entityConstructor,
          );
        this.fieldsToMerge.push(formField);
        this.mergeForm.addControl(key, this.fb.control(null));
      } else {
        this.mergedEntity[key] = this.entitiesToMerge[0][key];
      }
    });
  }

  trackByFn(index: number, field: FormFieldConfig): string {
    return field.id;
  }

  selectMergeValue(fieldKey: string, entityIndex: 0 | 1): void {
    const selectedValue = this.entitiesToMerge[entityIndex][fieldKey];
    const isStringType =
      this.fieldsToMerge.find((f) => f.id === fieldKey)?.dataType === "string";
    if (isStringType) {
      this.selectedValues[fieldKey] ??= [];
      const index = this.selectedValues[fieldKey].indexOf(selectedValue);
      index === -1
        ? this.selectedValues[fieldKey].push(selectedValue)
        : this.selectedValues[fieldKey].splice(index, 1);
      this.mergeForm
        .get(fieldKey)
        ?.setValue(this.selectedValues[fieldKey].join(", "));
    } else {
      this.selectedValues[fieldKey] = [selectedValue];
      this.mergeForm.get(fieldKey)?.setValue(selectedValue);
    }
  }

  isSelected(fieldKey: string, entityIndex: 0 | 1): boolean {
    return this.selectedValues[fieldKey]?.includes(
      this.entitiesToMerge[entityIndex][fieldKey],
    );
  }

  async confirmMerge(): Promise<boolean> {
    Object.assign(this.mergedEntity, this.mergeForm.value);
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

  cancelMerge(): void {
    this.dialogRef.close();
  }
}
