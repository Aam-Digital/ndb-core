import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
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
import { RecurringActivity } from "app/child-dev-project/attendance/model/recurring-activity";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";

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
    private alertService: AlertService,
    private entityMapperService: EntityMapperService
  ) {
    this.form = this.formService.createFormGroup(data.columns, data.entity);
    if (this.ability.cannot("update", data.entity)) {
      this.form.disable();
    }
    this.tempEntity = data.entity.copy();

    // for (const c of data.columns) {
    //   // if (c.edit === "EditEntityArray") {
    //   if (c.id === "title") {
    //     this.form.get(c.id).valueChanges.subscribe(async (value) => {
    //       // title changed
    //       // --> check if activity exist
    //       console.log("form title valueChanges", value);
    //       if (value) {
    //         this.tempEntity = await this.entityMapperService.load(
    //           c.additional,
    //           value
    //         );
    //         console.log("tempEntity", this.tempEntity);
    //         // this.tempEntity["type"] = "Home visit";
    //         this.formService.updateValues(this.form, this.tempEntity, "title");
    //         console.log("bye");
    //       }
    //     });
    //   }
    // if (c.id === "assignedTo") {
    //   this.form.get(c.id).valueChanges.subscribe((value) => {
    //     // title changed
    //     // --> check if activity exist
    //     console.log("form assignedTo valueChanges", value);

    //     // [2]
    //     // title as entity-select changed selected entity
    //     this.tempEntity = new RecurringActivity();
    //     this.tempEntity["title"] = "new title";
    //     // this.tempEntity["type"] = "Home visit";
    //     this.formService.updateValues(this.form, this.tempEntity, c.id);
    //     // this.form.setValue(this.tempEntity);
    //   });
    // }
    // }

    this.form.valueChanges.subscribe((value) => {
      Object.assign(this.tempEntity, value);
    });
    this.viewOnlyColumns = data.viewOnlyColumns;
  }

  save() {
    this.formService
      .saveChanges(this.form, this.data.entity)
      .then((res) => this.dialogRef.close(res))
      .catch((err) => this.alertService.addWarning(err.message));
  }

  delete() {
    this.entityRemoveService.remove(this.data.entity).subscribe((res) => {
      if (res === RemoveResult.REMOVED) {
        this.dialogRef.close();
      }
    });
  }
}
