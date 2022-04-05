import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../entity/entity-remove.service";

/**
 * Data interface that must be given when opening the dialog
 */
export interface DetailsComponentData<E extends Entity> {
  /** The row to edit / view */
  entity: E;
  /** The columns to edit / view */
  columns: FormFieldConfig[];
  /** Additional columns that only provide context information */
  viewOnlyColumns?: FormFieldConfig[];
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

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData<E>,
    private dialogRef: MatDialogRef<RowDetailsComponent<E>>,
    private formsService: EntityFormService,
    private ability: EntityAbility,
    private entityRemoveService: EntityRemoveService
  ) {
    this.form = this.formsService.createFormGroup(data.columns, data.entity);
    if (this.ability.cannot("update", data.entity)) {
      this.form.disable();
    }
    this.tempEntity = this.data.entity;
    this.form.valueChanges.subscribe((value) => {
      const dynamicConstructor: any = data.entity.getConstructor();
      this.tempEntity = Object.assign(new dynamicConstructor(), value);
    });
    this.viewOnlyColumns = data.viewOnlyColumns;
  }

  save() {
    this.formsService
      .saveChanges(this.form, this.data.entity)
      .then((res) => this.dialogRef.close(res));
  }

  delete() {
    this.entityRemoveService.remove(this.data.entity).subscribe((res) => {
      if (res === RemoveResult.REMOVED) {
        this.dialogRef.close();
      }
    });
  }
}
