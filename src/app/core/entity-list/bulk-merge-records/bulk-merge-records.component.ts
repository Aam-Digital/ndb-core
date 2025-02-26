import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogContent,
} from "@angular/material/dialog";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatRadioGroup, MatRadioModule } from "@angular/material/radio";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-bulk-merge-records",
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    ReactiveFormsModule,
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    CommonModule,
    // MatRadioGroup,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  mergeFields: { key: string; label: string }[];
  selectedValues: { [key: string]: any } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
    },
    private dialogRef: MatDialogRef<BulkMergeRecordsComponent<E>>,
  ) {
    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.mergedEntity = new this.entityConstructor() as E;
  }

  ngOnInit(): void {
    this.initMerge();
  }

  /**
   * Initialize the merge preview coloumn without any default selection.
   * Maps schema to include labels for keys.
   */
  private initMerge() {
    this.mergeFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([key, field]) => field.label)
      .map(([key, field]) => ({
        key: key,
        label: field.label,
      }));

    this.mergeFields.forEach((field) => {
      this.selectedValues[field.key] = undefined;
    });
    console.log(this.entitiesToMerge);
  }

  /**
   * Update the preview of the merged entity when a value is selected.
   * @param key The field key being updated.
   * @param value The selected value.
   */
  onSelectValue(key: string, value: any) {
    this.mergedEntity[key] = value;
  }

  /**
   * Confirm the merge action.
   */
  merge() {
    this.dialogRef.close(this.mergedEntity);
  }

  /**
   * Cancel the merge action.
   */
  cancel() {
    this.dialogRef.close();
  }
}
