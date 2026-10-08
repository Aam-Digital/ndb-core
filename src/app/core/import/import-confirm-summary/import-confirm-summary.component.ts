import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
import {
  describeSaveFailure,
  ImportService,
  PartialImportError,
} from "../import.service";
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
  /**
   * Whether records were written although the import failed as a whole.
   *
   * The usual reaction to an error is to refresh the data and let the user run the
   * import again - which for these would import the saved records a second time.
   */
  partiallyCompleted?: boolean;
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
      // a partial import carries the failure that stopped it. That failure explains
      // *why* the import stopped - but it must not replace the partial-import
      // message, because "please run the import again" is wrong once records have
      // been written. So the conflict advice is folded into that message instead.
      const partialImport =
        error instanceof PartialImportError ? error : undefined;
      const failure = partialImport ? partialImport.cause : error;

      if (partialImport) {
        this.showPartialImportWarning(
          partialImport,
          this.isPutAllConflictError(failure),
        );
      } else if (this.isPutAllConflictError(failure)) {
        this.showImportPutAllConflictWarning();
      } else {
        // Handle all other errors
        Logging.warn("Import failed with error", describeSaveFailure(error));
        this.showImportErrorMessage(error);
      }
      this.dialogRef.close({
        errorOccured: true,
        partiallyCompleted: !!partialImport,
        completedImport: partialImport?.completedImport,
      });
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
   * what is already there and how to get rid of it.
   */
  private showPartialImportWarning(
    error: PartialImportError,
    conflictsOccurred: boolean,
  ) {
    const whatHappened =
      error.stage === "links"
        ? $localize`All ${error.totalCount} records were imported, but linking them to the other records you selected failed.`
        : $localize`Only ${error.importedCount} of ${error.totalCount} records could be imported before an error occurred.`;

    const why = conflictsOccurred
      ? $localize`Some records had been changed through synchronisation while the import was being prepared, so they could not be overwritten.`
      : undefined;

    // without a history entry the saved records cannot be undone from the import
    // history, so pointing the user there would send them looking for nothing
    const whatToDo = error.completedImport
      ? $localize`The saved records are listed in the import history, where you can undo them. Please undo them there before importing this file again, to avoid creating duplicates.`
      : $localize`The saved records could not be recorded in the import history, so they cannot be undone there. Please review the existing data before importing this file again, to avoid creating duplicates.`;

    this.confirmationService.getConfirmation(
      error.stage === "links"
        ? $localize`Import completed with errors`
        : $localize`Import only partially completed`,
      [whatHappened, why, whatToDo].filter(Boolean).join(" "),
      OkButton,
    );
  }

  private showImportErrorMessage(error) {
    this.confirmationService.getConfirmation(
      $localize`Import failed`,
      $localize`Sorry, some error occurred during import. Please try again. If the problem persists, contact support. [${JSON.stringify(describeSaveFailure(error))}]`,
      OkButton,
    );
  }
}
