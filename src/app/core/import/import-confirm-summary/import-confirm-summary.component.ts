import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
import { ImportService, PartialImportError } from "../import.service";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  importInProgress = signal(false);
  showInheritanceImportWarning = signal(false);

  constructor() {
    const entityType = this.data?.importSettings?.entityType;
    const entityCtor = entityType
      ? this.entityRegistry.get(entityType)
      : undefined;

    this.showInheritanceImportWarning.set(
      !!entityCtor &&
        hasMappedInheritedSourceField(
          entityCtor,
          this.data?.importSettings?.columnMapping ?? [],
        ),
    );
  }

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc. (#1943)

  async executeImport() {
    this.importInProgress.set(true);
    this.dialogRef.disableClose = true;

    try {
      const completedImport = await this.importService.executeImport(
        this.data.entitiesToImport,
        this.data.importSettings,
      );
      this.showImportSuccessToast(completedImport);
      this.dialogRef.close({ completedImport });
    } catch (error) {
      // a partial import carries the failure that stopped it, and that failure
      // decides the message: a conflict has its own, more specific advice, which
      // must not be swallowed just because earlier batches had been written
      const failure = error instanceof PartialImportError ? error.cause : error;
      if (this.isPutAllConflictError(failure)) {
        this.showImportPutAllConflictWarning();
      } else if (error instanceof PartialImportError) {
        this.showPartialImportWarning(error);
      } else {
        // Handle all other errors
        Logging.warn("Import failed with error", error);
        this.showImportErrorMessage(error);
      }
      this.dialogRef.close({ errorOccured: true });
    } finally {
      this.importInProgress.set(false);
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

  /**
   * Unlike a completely failed import, a partial one must not be retried as a whole:
   * the records that were saved would be imported a second time. So the user is told
   * how many are already there and where to undo them.
   */
  private showPartialImportWarning(error: PartialImportError) {
    this.confirmationService.getConfirmation(
      $localize`Import only partially completed`,
      $localize`Only ${error.importedCount} of ${error.totalCount} records could be imported before an error occurred. The imported records have been saved and are listed in the import history, where you can undo them. Please check there before importing this file again, to avoid creating duplicates.`,
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
