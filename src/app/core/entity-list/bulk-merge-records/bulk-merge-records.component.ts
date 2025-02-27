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
  mergeFields: { key: string; label: string }[] = [];
  mergeForm: FormGroup;

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
    this.mergeFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, field]) => field.label)
      .map(([key, field]) => ({
        key: key,
        label: field.label,
      }));

    const hiddenFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, field]) => !field.label)
      .map(([key]) => key);

    this.mergeFields.forEach((field) => {
      this.mergeForm.addControl(field.key, this.fb.control(null));
    });

    // Initialize hidden fields with values from the first record
    hiddenFields.forEach((key) => {
      this.mergedEntity[key] = this.entitiesToMerge[0][key];
    });
  }

  /**
   * Confirm the merge action and close the dialog with merged data.
   */
  merge() {
    Object.keys(this.mergeForm.value).forEach((key) => {
      this.mergedEntity[key] = this.mergeForm.value[key];
    });
    this.dialogRef.close(this.mergedEntity);
  }

  /**
   * Cancel the merge action and close the dialog.
   */
  cancel() {
    this.dialogRef.close();
  }
}
