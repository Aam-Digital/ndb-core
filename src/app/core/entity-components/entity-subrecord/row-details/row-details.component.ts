import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from "@angular/material/legacy-dialog";
import { Entity } from "../../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../entity/entity-remove.service";
import { AlertService } from "../../../alerts/alert.service";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";

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
  form: EntityForm<E>;

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData<E>,
    private dialogRef: MatDialogRef<RowDetailsComponent<E>>,
    private formService: EntityFormService,
    private ability: EntityAbility,
    private entityRemoveService: EntityRemoveService,
    private alertService: AlertService
  ) {
    this.form = this.formService.createFormGroup(data.columns, data.entity);
    if (!this.data.entity.isNew && this.ability.cannot("update", data.entity)) {
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
    this.formService
      .saveChanges(this.form, this.data.entity)
      .then((res) => this.dialogRef.close(res))
      .catch((err) => {
        if (!(err instanceof InvalidFormFieldError)) {
          this.alertService.addDanger(err.message);
        }
      });
  }

  delete() {
    this.entityRemoveService.remove(this.data.entity).subscribe((res) => {
      if (res === RemoveResult.REMOVED) {
        this.dialogRef.close();
      }
    });
  }
}
