import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Angulartics2OnModule } from "angulartics2";
import { DisableEntityOperationDirective } from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { TableRow } from "../entities-table.component";
import { Entity } from "../../../entity/model/entity";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { EntityActionsService } from "../../../entity/entity-actions/entity-actions.service";

@Component({
  selector: "app-entity-inline-edit-actions",
  standalone: true,
  imports: [
    CommonModule,
    Angulartics2OnModule,
    DisableEntityOperationDirective,
    FaIconComponent,
    MatButtonModule,
  ],
  templateUrl: "./entity-inline-edit-actions.component.html",
  styleUrl: "./entity-inline-edit-actions.component.scss",
})
export class EntityInlineEditActionsComponent<T extends Entity = Entity> {
  @Input() row: TableRow<T>;

  constructor(
    private entityFormService: EntityFormService,
    private alertService: AlertService,
    private entityRemoveService: EntityActionsService,
  ) {}

  edit(row: TableRow<T>) {
    if (!row.formGroup) {
      row.formGroup = this.entityFormService.createFormGroup(
        Array.from(this.row.record.getSchema().keys()),
        row.record,
        true,
      );
    }
    row.formGroup.enable();
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   * @param row The entity to be saved.
   */
  async save(row: TableRow<T>): Promise<void> {
    try {
      row.record = await this.entityFormService.saveChanges(
        row.formGroup,
        row.record,
      );
      row.formGroup.disable();
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  async delete(row: TableRow<T>): Promise<void> {
    await this.entityRemoveService.delete(row.record);
  }

  /**
   * Discard any changes to the given entity and reset it to the state before the user started editing.
   * @param row The entity to be reset.
   */
  resetChanges(row: TableRow<T>) {
    row.formGroup = null;
  }
}
