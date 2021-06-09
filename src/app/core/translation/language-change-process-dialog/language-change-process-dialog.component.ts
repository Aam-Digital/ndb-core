import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: "app-language-change-process-dialog",
  template: `
    <p i18n>Changing your language</p>
    <p i18n>This may take a while...</p>
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  `,
})
export class LanguageChangeProcessDialogComponent {
  static show(dialog: MatDialog) {
    dialog.open(LanguageChangeProcessDialogComponent, { disableClose: true });
  }
}
