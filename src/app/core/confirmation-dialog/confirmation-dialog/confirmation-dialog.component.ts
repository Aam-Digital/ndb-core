import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

/**
 * A configurable confirmation dialog box
 * used by the {@link ConfirmationDialogService}.
 */
@Component({
  selector: "app-confirmation-dialog",
  templateUrl: "./confirmation-dialog.component.html",
  styleUrls: ["./confirmation-dialog.component.scss"],
})
export class ConfirmationDialogComponent {
  /**
   * This component is used as a template for MatDialog, created with the required dependencies through that service.
   * @param dialogRef The reference to the dialog this component is displayed within
   * @param data The configuration defining what text and buttons will be displayed
   */
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig
  ) {}
}

/**
 * Options to configure the {@link ConfirmationDialogComponent}.
 */
export interface ConfirmationDialogConfig {
  /** title of the dialog box */
  title: string;

  /** description text in the dialog box */
  text: string;

  /** Whether to display an option of yes/no buttons or just a single "ok" button */
  yesNo: boolean;

  /** Whether or not to specify a 'close' icon-button.
   * This button is on the top-right of the dialog and closes it with no result
   */
  closeButton?: boolean;
}
