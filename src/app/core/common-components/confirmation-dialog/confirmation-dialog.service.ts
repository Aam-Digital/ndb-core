import { Injectable, NgZone, inject, Signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
  DELETE_CONFIRMATION_KEYWORD,
  YesNoButtons,
} from "./confirmation-dialog/confirmation-dialog.component";
import { firstValueFrom } from "rxjs";
import { ProgressDialogComponent } from "./progress-dialog/progress-dialog.component";

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
  private dialog = inject(MatDialog);
  private ngZone = inject(NgZone);

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
    closeButton = true,
  ): Promise<boolean | string | undefined> {
    return this.openDialog({ title, text, buttons, closeButton });
  }

  /**
   * Open a confirmation dialog for a critical, irreversible action,
   * where the user additionally has to type the given keyword to unlock the confirming buttons.
   *
   * @param title The title displayed for the dialog
   * @param text The text displayed for the dialog
   * @param confirmationKeyword The word the user has to type to be able to confirm,
   *        e.g. {@link DELETE_CONFIRMATION_KEYWORD}
   * @param buttons The buttons to show. Defaults to 'yes' and 'no', but can be arbitrary
   * @param closeButton Whether a single icon-button with an 'x' is shown to the user
   */
  getConfirmationWithKeyword(
    title: string,
    text: string,
    confirmationKeyword: string,
    buttons: ConfirmationDialogButton[] = YesNoButtons,
    closeButton = true,
  ): Promise<boolean | string | undefined> {
    return this.openDialog({
      title,
      text,
      buttons,
      closeButton,
      confirmationKeyword,
    });
  }

  private openDialog(
    data: ConfirmationDialogConfig,
  ): Promise<boolean | string | undefined> {
    const dialogRef = this.ngZone.run(() =>
      this.dialog.open(ConfirmationDialogComponent, { data }),
    );
    return firstValueFrom(dialogRef.afterClosed());
  }

  getDiscardConfirmation() {
    return this.getConfirmation(
      $localize`:Discard changes header:Discard Changes?`,
      $localize`:Discard changes message:You have unsaved changes. Do you really want to leave this page? All unsaved changes will be lost.`,
    );
  }

  /**
   * Show an (indeterminate) progress bar modal that cannot be closed by the user.
   * Use the returned dialogRef to close the dialog once your processing is completed.
   * @param message
   */
  showProgressDialog(message: Signal<string>) {
    return this.dialog.open(ProgressDialogComponent, {
      data: { message },
      minWidth: "50vh",
      disableClose: true,
    });
  }
}
