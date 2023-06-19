import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent,
  YesNoButtons,
} from "./confirmation-dialog/confirmation-dialog.component";
import { map } from "rxjs/operators";
import { firstValueFrom } from "rxjs";

/**
 * Inject this service instead of MatDialog if you need a simple, configurable confirmation dialog box
 * to be displayed to the user.
 *
 * Import the {@link ConfirmationDialogModule} in your root module to provide this service.
 *
 * @example
 this.confirmationDialog
 .getConfirmation('Delete?', 'Are you sure you want to delete this record?')
 .then((confirmed) => {
    if (confirmed) {
       // delete
    }
  });
 */
@Injectable({ providedIn: "root" })
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
  getConfirmation(
    title: string,
    text: string,
    buttons: ConfirmationDialogButton[] = YesNoButtons,
    closeButton = true
  ): Promise<boolean> {
    return firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: title,
            text: text,
            buttons: buttons,
            closeButton: closeButton,
          },
        })
        .afterClosed()
    );
  }

  getDiscardConfirmation() {
    return this.getConfirmation(
      $localize`:Discard changes header:Discard Changes?`,
      $localize`:Discard changes message:You have unsaved changes. Do you really want to leave this page? All unsaved changes will be lost.`
    );
  }
}
