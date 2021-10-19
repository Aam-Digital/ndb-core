import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent,
  YesNoButtons,
} from "./confirmation-dialog/confirmation-dialog.component";

/**
 * Inject this service instead of MatDialog if you need a simple, configurable confirmation dialog box
 * to be displayed to the user.
 *
 * Import the {@link ConfirmationDialogModule} in your root module to provide this service.
 *
 * @example
 const dialogRef = this.confirmationDialog.openDialog('Delete?', 'Are you sure you want to delete this record?');
 dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
       // delete
    }
 });
 */
@Injectable()
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Open a dialog with the given configuration.
   * @param title The title displayed for the dialog
   * @param text The text displayed for the dialog
   * @param buttons The buttons to show. Defaults to 'yes' and 'no', but can be
   * arbitrary
   * @param closeButton Whether a single icon-button with an 'x' is shown to the user
   * @return The reference to the opened MatDialog.
   *          You can use this to control the dialog or subscribe to its result:
   *          (`ref.afterClosed().subscribe(confirmed => myAction(confirmed));`
   */
  openDialog(
    title: string,
    text: string,
    buttons: ConfirmationDialogButton[] = YesNoButtons,
    closeButton = true
  ): MatDialogRef<ConfirmationDialogComponent> {
    return this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: title,
        text: text,
        buttons: buttons,
        closeButton: closeButton,
      },
    });
  }
}
