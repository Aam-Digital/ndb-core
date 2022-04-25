import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent,
  YesNoButtons,
} from "./confirmation-dialog/confirmation-dialog.component";
import { map } from "rxjs/operators";

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
   * @returns promise that resolves to true if the user confirmed and false otherwise`
   */
  openDialog(
    title: string,
    text: string,
    buttons: ConfirmationDialogButton[] = YesNoButtons,
    closeButton = true
  ): Promise<boolean> {
    return this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: title,
          text: text,
          buttons: buttons,
          closeButton: closeButton,
        },
      })
      .afterClosed()
      .pipe(map((choice) => !!choice))
      .toPromise();
  }
}
