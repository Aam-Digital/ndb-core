import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { TableRow } from "../entity-subrecord/entity-subrecord.component";

export interface DetailsComponentData<E extends Entity> {
  row: TableRow<E>;
  columns: FormFieldConfig[];
  operations: CanSave<TableRow<E>> & CanDelete<TableRow<E>>;
}

export interface CanSave<T> {
  save(T);
}

export interface CanDelete<T> {
  delete(T);
}

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
