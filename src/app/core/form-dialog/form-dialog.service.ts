import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { ShowsEntity } from "./shows-entity.interface";

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
 formDialog.openDialog(NoteDetailsComponent, noteEntity);
 */
@Injectable()
export class FormDialogService {
  constructor(
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  openDialog<T extends ShowsEntity>(
    entityDetailsComponent: ComponentType<T>,
    entity: any
  ): MatDialogRef<T> {
    const dialogRef = this.dialog.open(entityDetailsComponent, {
      width: "80%",
    });
    dialogRef.componentInstance.entity = entity;

    const dialogWrapper = dialogRef.componentInstance.formDialogWrapper;
    dialogWrapper.onClose.subscribe(() => dialogRef.close(true));

    dialogRef.beforeClosed().subscribe((activelyClosed) => {
      if (!activelyClosed && dialogWrapper.isFormDirty) {
        this.confirmationDialog
          .openDialog(
            "Save Changes?",
            "Do you want to save the changes you made to the record?"
          )
          .afterClosed()
          .subscribe((confirmed) => {
            if (confirmed) {
              dialogWrapper.save();
            } else {
              dialogWrapper.cancel();
            }
          });
      }
    });

    return dialogRef;
  }
}
