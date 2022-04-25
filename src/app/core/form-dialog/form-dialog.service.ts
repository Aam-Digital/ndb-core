import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { ShowsEntity } from "./shows-entity.interface";
import { OnInitDynamicComponent } from "../view/dynamic-components/on-init-dynamic-component.interface";
import { Entity } from "../entity/model/entity";
import { EntityAbility } from "../permissions/ability/entity-ability";

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
  constructor(
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
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
    const dialogRef = this.dialog.open(entityDetailsComponent, {
      width: "80%",
      maxHeight: "90vh",
    });

    dialogRef.componentInstance.entity = entity;
    if (
      typeof (dialogRef.componentInstance as OnInitDynamicComponent)
        .onInitFromDynamicConfig === "function"
    ) {
      (dialogRef.componentInstance as OnInitDynamicComponent).onInitFromDynamicConfig(
        componentConfig
      );
    }

    const dialogWrapper = dialogRef.componentInstance.formDialogWrapper;
    dialogWrapper.readonly = this.ability.cannot("update", entity);

    dialogWrapper.onClose.subscribe((res) => dialogRef.close(res));

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
}
