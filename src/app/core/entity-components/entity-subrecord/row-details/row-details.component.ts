import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { TableRow } from "../entity-subrecord/entity-subrecord.component";
import { OperationType } from "../../../permissions/entity-permissions.service";

/**
 * Data interface that must be given when opening the dialog
 */
export interface DetailsComponentData<E extends Entity> {
  /** The row to edit / view */
  row: TableRow<E>;
  /** The columns to edit / view */
  columns: FormFieldConfig[];
  /** Additional columns that only provide context information */
  viewOnlyColumns?: FormFieldConfig[];
  /** The operations needed by this component; namely edit and delete */
  operations: CanSave<TableRow<E>> & CanDelete<TableRow<E>>;
  isNew: boolean;
}

/**
 * Simple interface that the `EntitySubrecordComponent` implements
 * to allow this component to directly save it's data there.
 * Can be used on another component in conjunction with this component
 * to allow it to save rows
 */
export interface CanSave<T> {
  save(T, isNew: boolean);
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
  operationType = OperationType;

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData<E>,
    private formsService: EntityFormService
  ) {
    this.form = this.formsService.createFormGroup(
      data.columns,
      data.row.record
    );
    this.tempEntity = this.data.row.record;
    this.form.valueChanges.subscribe((value) => {
      const dynamicConstructor: any = data.row.record.getConstructor();
      this.tempEntity = Object.assign(new dynamicConstructor(), value);
    });
    this.viewOnlyColumns = data.viewOnlyColumns;
  }

  save() {
    this.data.operations.save(
      {
        record: this.data.row.record,
        formGroup: this.form,
      },
      this.data.isNew
    );
  }

  delete() {
    this.data.operations.delete(this.data.row);
  }
}
