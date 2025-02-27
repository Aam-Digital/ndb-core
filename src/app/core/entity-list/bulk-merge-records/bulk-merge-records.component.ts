import { Component, Inject, OnInit } from "@angular/core";
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
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  mergeFields: { key: string; label: string; dataType: any }[] = [];
  mergeForm: FormGroup;
  trackByFieldKey(index: number, field: any) {
    return field.key;
  }
  selectedValues: { [key: string]: string[] } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
    },
    private dialogRef: MatDialogRef<BulkMergeRecordsComponent<E>>,
    private fb: FormBuilder,
  ) {
    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.mergedEntity = new this.entityConstructor() as E;
    this.mergeForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initMerge();
  }

  /**
   * Initialize the merge form with the fields to merge
   * and the values of the first record.
   * Hidden fields are initialized with the values of the first record. They are not shown in the form.
   */
  private initMerge() {
    this.entityConstructor.schema.forEach((field, key) => {
      if (field.label) {
        this.mergeFields.push({
          key,
          label: field.label,
          dataType: field.dataType,
        });
        this.mergeForm.addControl(key, this.fb.control(null));
      } else {
        // Initialize hidden fields with values from the first record
        this.mergedEntity[key] = this.entitiesToMerge[0][key];
      }
    });
  }

  toggleSelection(key: string, option: "entity1" | "entity2") {
    const selectedValue =
      this.entitiesToMerge[option === "entity1" ? 0 : 1][key];
    const isStringType =
      this.mergeFields.find((f) => f.key === key)?.dataType === "string";

    if (isStringType) {
      this.selectedValues[key] = this.selectedValues[key] || [];

      const index = this.selectedValues[key].indexOf(selectedValue);

      index === -1
        ? this.selectedValues[key].push(selectedValue)
        : this.selectedValues[key].splice(index, 1);

      this.mergeForm.get(key)?.setValue(this.selectedValues[key].join(", "));
    } else {
      this.selectedValues[key] = [selectedValue];
      this.mergeForm.get(key)?.setValue(selectedValue);
    }
  }

  isSelected(key: string, option: "entity1" | "entity2"): boolean {
    return this.selectedValues[key]?.includes(
      this.entitiesToMerge[option === "entity1" ? 0 : 1][key],
    );
  }

  merge() {
    Object.keys(this.mergeForm.value).forEach((key) => {
      this.mergedEntity[key] = this.mergeForm.value[key];
    });
    console.log(this.mergedEntity);
    this.dialogRef.close(this.mergedEntity);
  }

  cancel() {
    this.dialogRef.close();
  }
}
