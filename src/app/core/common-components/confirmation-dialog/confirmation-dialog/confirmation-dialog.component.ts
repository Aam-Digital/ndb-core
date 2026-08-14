import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
} from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "../../dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MarkdownComponent } from "ngx-markdown";

/**
 * A configurable confirmation dialog box
 * used by the {@link ConfirmationDialogService}.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-confirmation-dialog",
  templateUrl: "./confirmation-dialog.component.html",
  styleUrl: "./confirmation-dialog.component.scss",
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MarkdownComponent,
  ],
})
export class ConfirmationDialogComponent {
  dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  data = inject<ConfirmationDialogConfig>(MAT_DIALOG_DATA);

  /** what the user has typed into the confirmation input (if a keyword is required) */
  typedConfirmation = signal("");

  /** whether the required keyword has been entered correctly */
  private readonly keywordEntered = computed(() => {
    const keyword = this.data.confirmationKeyword;
    return (
      !keyword ||
      this.typedConfirmation().trim().toLowerCase() === keyword.toLowerCase()
    );
  });

  /**
   * Confirming buttons stay disabled until the required keyword has been typed,
   * while buttons that abort the action (e.g. "Cancel") remain available.
   */
  isBlocked(button: ConfirmationDialogButton): boolean {
    return !!button.dialogResult && !this.keywordEntered();
  }
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

  /**
   * If set, the user has to type this keyword into an input field
   * before the confirming buttons become available.
   *
   * Use this as an additional safeguard for critical, irreversible actions.
   */
  confirmationKeyword?: string;
}

/**
 * The keyword a user has to type to confirm an action that deletes data irreversibly.
 */
export const DELETE_CONFIRMATION_KEYWORD = $localize`:Keyword to be typed by the user to confirm deleting data:delete`;

export interface ConfirmationDialogButton {
  text: string;
  dialogResult?: boolean | string | undefined;
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

export function CustomYesNoButtons(
  yesLabel: string,
  noLabel: string,
): ConfirmationDialogButton[] {
  return [
    { text: yesLabel, dialogResult: true, click() {} },
    { text: noLabel, dialogResult: false, click() {} },
  ];
}
