import { Component } from "@angular/core";

@Component({
  template: `
    <p i18n>Migrating local data to latest version</p>
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  `,
})
export class DatabaseMigrationDialogComponent {}
