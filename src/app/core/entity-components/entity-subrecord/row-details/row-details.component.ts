import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import { NgForOf, NgIf } from "@angular/common";
import { PillComponent } from "../../../common-components/pill/pill.component";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogButtonsComponent } from "../../../form-dialog/dialog-buttons/dialog-buttons.component";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";

/**
 * Data interface that must be given when opening the dialog
 */
export interface DetailsComponentData {
  /** The row to edit / view */
  entity: Entity;
  /** The columns to edit / view */
  columns: FormFieldConfig[];
  /** Additional columns that only provide context information */
  viewOnlyColumns?: FormFieldConfig[];
}

/**
 * Displays a single row of a table as a dialog component
 */
@UntilDestroy()
@Component({
  selector: "app-row-details",
  templateUrl: "./row-details.component.html",
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    EntityFormComponent,
    NgForOf,
    PillComponent,
    MatTooltipModule,
    NgIf,
    DynamicComponentDirective,
    DialogButtonsComponent,
  ],
  standalone: true,
})
export class RowDetailsComponent {
  form: EntityForm<Entity>;
  columns: FormFieldConfig[][];

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData,
    private formService: EntityFormService,
    private unsavedChanges: UnsavedChangesService
  ) {
    this.form = this.formService.createFormGroup(data.columns, data.entity);
    // TODO this would make more sense inside the service but can't be unsubscribed there. That might not be a problem though
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => (this.unsavedChanges.pending = this.form.dirty));
    this.columns = data.columns.map((col) => [col]);
    this.tempEntity = this.data.entity;
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const dynamicConstructor: any = data.entity.getConstructor();
      this.tempEntity = Object.assign(new dynamicConstructor(), value);
    });
    this.viewOnlyColumns = data.viewOnlyColumns;
  }
}
