import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Component, inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { PillComponent } from "../../common-components/pill/pill.component";
import { EntityArchivedInfoComponent } from "../../entity-details/entity-archived-info/entity-archived-info.component";
import { FieldGroup } from "../../entity-details/form/field-group";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { Entity } from "../../entity/model/entity";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";
import { DialogButtonsComponent } from "../dialog-buttons/dialog-buttons.component";

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
    PillComponent,
    MatTooltipModule,
    DialogButtonsComponent,
    EntityArchivedInfoComponent,
    EntityFieldViewComponent,
  ],
  viewProviders: [
    { provide: ViewComponentContext, useValue: new ViewComponentContext(true) },
  ],
})
export class RowDetailsComponent implements OnInit {
  data = inject<DetailsComponentData>(MAT_DIALOG_DATA);
  private formService = inject(EntityFormService);

  form: EntityForm<Entity>;
  fieldGroups: FieldGroup[];

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;

  ngOnInit(): void {
    this.init(this.data)
      .then()
      .catch((reason) => console.log(reason));
  }

  private async init(data: DetailsComponentData) {
    this.form = await this.formService.createEntityForm(
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
