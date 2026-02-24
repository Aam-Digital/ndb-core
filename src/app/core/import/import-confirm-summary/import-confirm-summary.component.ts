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
import { Logging } from "../../logging/logging.service";

/**
 * Data passed into Import Confirmation Dialog.
 */
export interface ImportDialogData {
  entitiesToImport: Entity[];
  importSettings: ImportSettings;
}

/**
 * Result returned from Import Confirmation Dialog.
 */
export interface ImportDialogResult {
  completedImport?: ImportMetadata;
  conflictOccurred?: boolean;
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
  private dialogRef =
    inject<MatDialogRef<ImportConfirmSummaryComponent>>(MatDialogRef);
  data = inject<ImportDialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);
  private importService = inject(ImportService);

  importInProgress: boolean;

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc. (#1943)

  async executeImport() {
    this.importInProgress = true;
    this.dialogRef.disableClose = true;

    try {
      const completedImport = await this.importService.executeImport(
        this.data.entitiesToImport,
        this.data.importSettings,
      );
      this.showImportSuccessToast(completedImport);
      this.dialogRef.close({ completedImport });
    } catch (error) {
      if (this.isPutAllConflictError(error)) {
        this.handlePutAllConflict();
        return;
      }
      // Handle all other errors
      Logging.warn("Import failed with error", error);
      this.showImportErrorMessage();
    } finally {
      this.importInProgress = false;
      this.dialogRef.disableClose = false;
    }
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

  private showImportPutAllConflictWarning() {
    this.snackBar.open(
      $localize`Some records changed while importing. Data has been refreshed. Please review and run import again.`,
      $localize`Close`,
      { duration: 10000 },
    );
  }

  private showImportErrorMessage() {
    this.snackBar.open(
      $localize`Import failed. Please try again or contact support if the problem persists.`,
      $localize`Close`,
      { duration: 10000 },
    );
  }

  private handlePutAllConflict() {
    this.showImportPutAllConflictWarning();
    this.dialogRef.close({ conflictOccurred: true });
  }

  private isPutAllConflictError(error: unknown): boolean {
    if (!Array.isArray(error)) {
      return false;
    }

    return error.some((entry) => {
      const putAllError = entry as {
        status?: number;
        name?: string;
        error?: string;
      };

      return (
        putAllError.status === 409 ||
        putAllError.name === "conflict" ||
        putAllError.error === "conflict"
      );
    });
  }
}
