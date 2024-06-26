import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import {
  EntityFormService,
  ExtendedEntityForm,
} from "../../common-components/entity-form/entity-form.service";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { NgForOf, NgIf } from "@angular/common";
import { PillComponent } from "../../common-components/pill/pill.component";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogButtonsComponent } from "../dialog-buttons/dialog-buttons.component";
import { EntityArchivedInfoComponent } from "../../entity-details/entity-archived-info/entity-archived-info.component";
import { FieldGroup } from "../../entity-details/form/field-group";
import { EntityFieldEditComponent } from "../../common-components/entity-field-edit/entity-field-edit.component";
import { EntityFieldViewComponent } from "../../common-components/entity-field-view/entity-field-view.component";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";

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
    EntityArchivedInfoComponent,
    EntityFieldEditComponent,
    EntityFieldViewComponent,
  ],
  viewProviders: [
    { provide: ViewComponentContext, useValue: new ViewComponentContext(true) },
  ],
  standalone: true,
})
export class RowDetailsComponent {
  form: ExtendedEntityForm<Entity>;
  fieldGroups: FieldGroup[];

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData,
    private formService: EntityFormService,
  ) {
    this.init(data)
      .then()
      .catch((reason) => console.log(reason)); // todo this should not called in constructor?
  }

  private async init(data: DetailsComponentData) {
    this.form = await this.formService.createExtendedEntityForm(
      data.columns,
      data.entity,
    );
    this.enableSaveWithoutChangesIfNew(data.entity);

    this.fieldGroups = data.columns.map((col) => ({ fields: [col] }));
    this.tempEntity = this.data.entity;
    this.form.formGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        const dynamicConstructor: any = data.entity.getConstructor();
        this.tempEntity = Object.assign(new dynamicConstructor(), value);
      });
    this.viewOnlyColumns = data.viewOnlyColumns;
  }

  private enableSaveWithoutChangesIfNew(entity: Entity) {
    if (entity.isNew) {
      // could check here that at least some fields hold a value but the naive heuristic to allow save of all new seems ok
      this.form.formGroup.markAsDirty();
    }
  }
}
