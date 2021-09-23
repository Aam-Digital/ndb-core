import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper.service";

export interface DetailsComponentData<E extends Entity> {
  record: E;
  rows: FormFieldConfig[];
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
    private dialogRef: MatDialogRef<RowDetailsComponent<E>>,
    private formsService: EntityFormService,
    private entityMapperService: EntityMapperService
  ) {
    this.form = this.formsService.createFormGroup(data.rows, data.record);
  }

  async save() {
    await this.formsService.saveChanges(this.form, this.data.record);
  }

  async delete() {
    await this.entityMapperService.remove(this.data.record);
  }
}
