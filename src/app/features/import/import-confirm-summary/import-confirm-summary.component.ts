import { Component, Inject } from "@angular/core";
import { ImportService } from "../import.service";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";

/**
 * Data passed into Import Confirmation Dialog.
 */
export interface ImportDialogData {
  entitiesToImport: Entity[];
  importSettings: ImportSettings;
}

/**
 * Summary screen and confirmation / execution dialog for running an import.
 */
@Component({
  selector: "app-import-confirm-summary",
  templateUrl: "./import-confirm-summary.component.html",
  styleUrls: ["./import-confirm-summary.component.scss"],
  standalone: true,
  imports: [MatDialogModule, NgIf, MatProgressBarModule, MatButtonModule],
})
export class ImportConfirmSummaryComponent {
  importInProgress: boolean;

  constructor(
    private dialogRef: MatDialogRef<ImportConfirmSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportDialogData,
    private snackBar: MatSnackBar,
    private importService: ImportService
  ) {}

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc.

  async executeImport() {
    this.importInProgress = true;
    this.dialogRef.disableClose = true;

    const completedImport = await this.importService.executeImport(
      this.data.entitiesToImport,
      this.data.importSettings
    );
    this.showImportSuccessToast(completedImport);

    this.importInProgress = false;
    this.dialogRef.disableClose = false;
    this.dialogRef.close(completedImport);
  }

  private showImportSuccessToast(completedImport: ImportMetadata) {
    const snackBarRef = this.snackBar.open(
      $localize`Import completed`,
      $localize`Undo`,
      {
        duration: 8000,
      }
    );
    snackBarRef.onAction().subscribe(async () => {
      await this.importService.undoImport(completedImport);
    });
  }
}
