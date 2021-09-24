import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { TableRow } from "../entity-subrecord/entity-subrecord.component";

/**
 * Data interface that must be given when opening the dialog
 */
export interface DetailsComponentData<E extends Entity> {
  /** The row to edit / view */
  row: TableRow<E>;
  /** The columns to edit / view */
  columns: FormFieldConfig[];
  /** The operations needed by this component; namely edit and delete */
  operations: CanSave<TableRow<E>> & CanDelete<TableRow<E>>;
}

/**
 * Simple interface that the `EntitySubrecordComponent` implements
 * to allow this component to directly save it's data there.
 * Can be used on another component in conjunction with this component
 * to allow it to save rows
 */
export interface CanSave<T> {
  save(T);
}

/**
 * Simple interface that the `EntitySubrecordComponent` implements
 * to allow this component to directly delete it's data there.
 * Can be used on another component in conjunction with this component
 * to allow it to delete rows
 */
export interface CanDelete<T> {
  delete(T);
}

/**
 * Displays a single row of a table as a dialog component
 */
@Component({
  selector: "app-row-details",
  templateUrl: "./row-details.component.html",
  styleUrls: ["./row-details.component.scss"],
})
export class RowDetailsComponent<E extends Entity> {
  form: FormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData<E>,
    private formsService: EntityFormService
  ) {
    this.form = this.formsService.createFormGroup(
      data.columns,
      data.row.record
    );
  }

  save() {
    this.data.operations.save(this.data.row);
  }

  delete() {
    this.data.operations.delete(this.data.row);
  }
}
