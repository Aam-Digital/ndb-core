import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

/**
 * A process dialog that indicates that the language change is under process
 * This dialog automatically closes if the new language was chosen and therefore doesn't
 * have to be closed manually. Additionally, it can't be closed by a user
 * since the site is currently loading the newly chosen language
 */
@Component({
  selector: "app-language-change-process-dialog",
  template: `
    <p i18n>Changing your language</p>
    <p i18n>This may take a while...</p>
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  `,
})
export class LanguageChangeProcessDialogComponent {
  /**
   * shows the dialog
   * @param dialog The MatDialog to use to show this dialog
   */
  static show(dialog: MatDialog) {
    dialog.open(LanguageChangeProcessDialogComponent, { disableClose: true });
  }
}
