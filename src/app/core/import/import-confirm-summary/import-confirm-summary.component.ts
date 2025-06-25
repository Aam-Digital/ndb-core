import { Component, inject } from "@angular/core";
import { ImportService } from "../import.service";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { MatSnackBar } from "@angular/material/snack-bar";
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
  imports: [MatDialogModule, MatProgressBarModule, MatButtonModule],
})
export class ImportConfirmSummaryComponent {
  private dialogRef = inject<MatDialogRef<ImportConfirmSummaryComponent>>(MatDialogRef);
  data = inject<ImportDialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);
  private importService = inject(ImportService);

  importInProgress: boolean;

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc. (#1943)

  async executeImport() {
    this.importInProgress = true;
    this.dialogRef.disableClose = true;

    const completedImport = await this.importService.executeImport(
      this.data.entitiesToImport,
      this.data.importSettings,
    );
    this.showImportSuccessToast(completedImport);

    this.dialogRef.close(completedImport);
  }

  private showImportSuccessToast(completedImport: ImportMetadata) {
    const snackBarRef = this.snackBar.open(
      $localize`Import completed`,
      $localize`Undo`,
      {
        duration: 8000,
      },
    );
    snackBarRef.onAction().subscribe(async () => {
      await this.importService.undoImport(completedImport);
    });
  }
}
