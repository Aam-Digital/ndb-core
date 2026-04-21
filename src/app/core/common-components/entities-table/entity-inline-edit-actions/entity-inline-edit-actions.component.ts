import { Component, inject, Input } from "@angular/core";
import { Angulartics2OnModule } from "angulartics2";
import { DisableEntityOperationDirective } from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { TableRow } from "../table-row";
import { Entity } from "../../../entity/model/entity";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { AlertService } from "../../../alerts/alert.service";
import { EntityActionsService } from "../../../entity/entity-actions/entity-actions.service";
import { UnsavedChangesService } from "../../../entity-details/form/unsaved-changes.service";

/**
 * Buttons to edit an (entities-table) row inline, handling the necessary logic and UI buttons.
 */
@Component({
  selector: "app-entity-inline-edit-actions",
  imports: [
    Angulartics2OnModule,
    DisableEntityOperationDirective,
    FaIconComponent,
    MatButtonModule,
  ],
  templateUrl: "./entity-inline-edit-actions.component.html",
  styleUrl: "./entity-inline-edit-actions.component.scss",
})
export class EntityInlineEditActionsComponent<T extends Entity = Entity> {
  private entityFormService = inject(EntityFormService);
  private alertService = inject(AlertService);
  private entityRemoveService = inject(EntityActionsService);
  private unsavedChanges = inject(UnsavedChangesService);

  @Input() row: TableRow<T>;

  form: EntityForm<T>;

  async edit() {
    this.form = await this.entityFormService.createEntityForm(
      Array.from(this.row.record.getSchema().keys()),
      this.row.record,
      true,
    );

    this.row.formGroup = this.form.formGroup;

    this.row.formGroup.enable();
  }

  /**
   * Save an edited record to the database (if validation succeeds).
   */
  async save(): Promise<void> {
    try {
      this.row.record = await this.entityFormService.saveChanges(
        this.form,
        this.row.record,
      );
      delete this.row.formGroup;
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  async delete(): Promise<void> {
    await this.entityRemoveService.delete(this.row.record);
  }

  /**
   * Discard any changes to the given entity and reset it to the state before the user started editing.
   */
  resetChanges() {
    delete this.row.formGroup;
    this.unsavedChanges.pending = false;
  }
}
