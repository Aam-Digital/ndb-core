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
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { HintBoxComponent } from "../../common-components/hint-box/hint-box.component";
import { hasMappedInheritedSourceField } from "../import-inheritance-warning.util";

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
  errorOccured?: boolean;
}

/**
 * Summary screen and confirmation / execution dialog for running an import.
 */
@Component({
  selector: "app-import-confirm-summary",
  templateUrl: "./import-confirm-summary.component.html",
  styleUrls: ["./import-confirm-summary.component.scss"],
  imports: [
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    HintBoxComponent,
  ],
})
export class ImportConfirmSummaryComponent {
  private readonly dialogRef =
    inject<MatDialogRef<ImportConfirmSummaryComponent>>(MatDialogRef);
  data = inject<ImportDialogData>(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly importService = inject(ImportService);
  private readonly entityRegistry = inject(EntityRegistry);

  importInProgress: boolean;
  showInheritanceImportWarning = false;

  constructor() {
    const entityType = this.data?.importSettings?.entityType;
    const entityCtor = entityType
      ? this.entityRegistry.get(entityType)
      : undefined;

    this.showInheritanceImportWarning =
      !!entityCtor &&
      hasMappedInheritedSourceField(
        entityCtor,
        this.data?.importSettings?.columnMapping ?? [],
      );
  }

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
        this.showImportPutAllConflictWarning();
      } else {
        // Handle all other errors
        Logging.warn("Import failed with error", error);
        this.showImportErrorMessage(error);
      }
      this.dialogRef.close({ errorOccured: true });
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

  private showImportPutAllConflictWarning() {
    this.confirmationService.getConfirmation(
      $localize`Conflicts overwriting updated data`,
      $localize`Some records changed from synchronisation while preparing the import. We are refreshing the data for you. Please review and run import again.`,
      OkButton,
    );
  }

  private showImportErrorMessage(error) {
    this.confirmationService.getConfirmation(
      $localize`Import failed`,
      $localize`Sorry, some error occurred during import. Please try again. If the problem persists, contact support. [${JSON.stringify(error)}]`,
      OkButton,
    );
  }
}
