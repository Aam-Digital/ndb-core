import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "../../dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";

/**
 * A configurable confirmation dialog box
 * used by the {@link ConfirmationDialogService}.
 */
@Component({
  selector: "app-confirmation-dialog",
  templateUrl: "./confirmation-dialog.component.html",
  imports: [DialogCloseComponent, MatDialogModule, MatButtonModule],
})
export class ConfirmationDialogComponent {
  dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  data = inject<ConfirmationDialogConfig>(MAT_DIALOG_DATA);
}

/**
 * Options to configure the {@link ConfirmationDialogComponent}.
 */
export interface ConfirmationDialogConfig {
  /** title of the dialog box */
  title: string;

  /** description text in the dialog box */
  text: string;

  /** The buttons that should be displayed */
  buttons: ConfirmationDialogButton[];

  /** Whether or not to specify a 'close' icon-button.
   * This button is on the top-right of the dialog and closes it with no result
   */
  closeButton?: boolean;
}

export interface ConfirmationDialogButton {
  text: string;
  dialogResult?: boolean | undefined;
  click();
}

export const OkButton: ConfirmationDialogButton[] = [
  {
    text: $localize`:Confirmation dialog OK:OK`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: true,
  },
];

export const YesNoButtons: ConfirmationDialogButton[] = [
  {
    text: $localize`:Confirmation dialog Yes:Yes`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: true,
  },
  {
    text: $localize`:Confirmation dialog No:No`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: false,
  },
];

export const YesNoCancelButtons: ConfirmationDialogButton[] = [
  {
    text: $localize`:Confirmation dialog Yes:Yes`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: true,
  },
  {
    text: $localize`:Confirmation dialog No:No`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: false,
  },
  {
    text: $localize`:Confirmation dialog Cancel:Cancel`,
    click() {
      // Intentionally blank
      // To react to emissions from this button, use the `MatDialogRef.beforeClosed()` hook
    },
    dialogResult: undefined,
  },
];
