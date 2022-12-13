import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { ShowsEntity } from "./shows-entity.interface";
import { OnInitDynamicComponent } from "../view/dynamic-components/on-init-dynamic-component.interface";
import { Entity } from "../entity/model/entity";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { RowDetailsComponent } from "../entity-components/entity-subrecord/row-details/row-details.component";
import { FormFieldConfig } from "../entity-components/entity-form/entity-form/FormConfig";
import {
  ColumnConfig,
  toFormFieldConfig,
} from "../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

/**
 * Inject this service instead of MatDialog to display a form or details view as a modal
 * (hovering over the rest of the UI).
 *
 * This takes care of generic logic like a user prompt asking whether changes should be saved before leaving the dialog.
 * Components used with this have to use {@link FormDialogWrapperComponent} and implement {@link ShowsEntity}.
 *
 * Import the {@link FormDialogModule} in your root module to provide this service.
 *
 * @example
 formDialog.getConfirmation(NoteDetailsComponent, noteEntity);
 */
@Injectable()
export class FormDialogService {
  static dialogSettings = {
    width: "80%",
    maxHeight: "90vh",
  };

  constructor(
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
    private schemaService: EntitySchemaService,
    private ability: EntityAbility
  ) {}

  openDialog<
    E extends Entity,
    T extends ShowsEntity<E> | (ShowsEntity<E> & OnInitDynamicComponent)
  >(
    entityDetailsComponent: ComponentType<T>,
    entity: E,
    componentConfig?: any
  ): MatDialogRef<T> {
    const dialogRef = this.dialog.open(
      entityDetailsComponent,
      FormDialogService.dialogSettings
    );

    dialogRef.componentInstance.entity = entity;
    if (this.isDynamicComponent(dialogRef.componentInstance)) {
      dialogRef.componentInstance.onInitFromDynamicConfig(componentConfig);
    }

    const dialogWrapper = dialogRef.componentInstance.formDialogWrapper;
    dialogWrapper.readonly = this.ability.cannot("update", entity);

    dialogWrapper.close.subscribe((res) => dialogRef.close(res));

    dialogRef.beforeClosed().subscribe((activelyClosed) => {
      if (!activelyClosed && dialogWrapper.isFormDirty) {
        this.confirmationDialog
          .getConfirmation(
            $localize`:Save changes header:Save Changes?`,
            $localize`:Save changes message:Do you want to save the changes you made to the record?`
          )
          .then((confirmed) =>
            confirmed ? dialogWrapper.save() : dialogWrapper.cancel()
          );
      }
    });

    return dialogRef;
  }

  /**
   * Open a form in a popup that allows to edit the given entity.
   * @param entity
   * @param columnsOverall
   * @param component
   */
  openSimpleForm<E extends Entity>(
    entity: E,
    columnsOverall: ColumnConfig[],
    component?: ComponentType<any>
  ): MatDialogRef<RowDetailsComponent<Entity>> {
    // TODO: merge this with openDialog method above for removing further duplication (see #921)
    const columns: FormFieldConfig[] = this.inferFormFieldColumns(
      columnsOverall,
      entity
    );

    const columnsToDisplay = columns
      .filter((col) => col.edit)
      .map((col) => Object.assign({}, col, { forTable: false }));

    return this.dialog.open(component ?? RowDetailsComponent, {
      ...FormDialogService.dialogSettings,
      data: {
        entity: entity,
        columns: columnsToDisplay,
        viewOnlyColumns: columns.filter((col) => !col.edit),
      },
    });
  }

  private inferFormFieldColumns(
    columnsOverall: ColumnConfig[],
    entity: Entity
  ) {
    const columns = columnsOverall.map(toFormFieldConfig);

    for (const c of columns) {
      if (!c.edit) {
        c.edit = this.schemaService.getComponent(
          entity.getSchema().get(c.id),
          "edit"
        );
      }
    }

    return columns;
  }

  private isDynamicComponent(component): component is OnInitDynamicComponent {
    return typeof component.onInitFromDynamicConfig === "function";
  }
}
