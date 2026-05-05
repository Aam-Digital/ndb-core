import { Injectable, inject } from "@angular/core";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import {
  CustomYesNoButtons,
  OkButton,
} from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { LOCATION_TOKEN } from "#src/app/utils/di-tokens";
import { BackupService } from "../../admin/backup/backup.service";
import { Logging } from "../../logging/logging.service";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";

/**
 * Handles user-facing recovery flows when PouchDB IndexedDB corruption is detected.
 * Shows targeted dialogs and optionally resets the local database to a clean state.
 */
@Injectable({ providedIn: "root" })
export class PouchdbCorruptionRecoveryService {
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly location = inject<Location>(LOCATION_TOKEN);
  private warningDialogOpen = false;
  private resetDialogOpen = false;

  async promptMultiTabWarningDialog(): Promise<void> {
    if (environment.session_type === SessionType.online) {
      return;
    }
    if (this.warningDialogOpen) {
      return;
    }
    this.warningDialogOpen = true;

    try {
      await this.confirmationDialog.getConfirmation(
        $localize`:multi-tab warning dialog title:Multiple Tabs Open`,
        $localize`:multi-tab warning dialog text:The app is open in multiple tabs, which can break the local database.

Please close the other tabs and try again to avoid local database corruption.

We are working on improvements to allow this in the future.`,
        OkButton,
        false,
      );
    } finally {
      this.warningDialogOpen = false;
    }
  }

  async promptResetApplicationDialog(): Promise<void> {
    if (this.resetDialogOpen) {
      return;
    }
    this.resetDialogOpen = true;

    try {
      const shouldReset = await this.confirmationDialog.getConfirmation(
        $localize`:local db corruption dialog title:Local Database Needs Reset`,
        $localize`:local db corruption dialog text:The local database appears corrupted and saving is no longer reliable.

This can happen after using multiple tabs in parallel.
We are working on improvements to allow this in the future.`,
        CustomYesNoButtons(
          $localize`:local db corruption dialog button reset:Reset Application`,
          $localize`:Confirmation dialog Cancel:Cancel`,
        ),
        false,
      );

      if (shouldReset === true) {
        this.resetApplication();
      }
    } finally {
      this.resetDialogOpen = false;
    }
  }

  private resetApplication() {
    sessionStorage.setItem(BackupService.RESET_PENDING_KEY, "1");
    this.location.pathname = "";
  }

  handleKnownMultiTabCorruption(err: unknown, logMessage: string): void {
    if (!isKnownMultiTabDatabaseCorruption(err)) {
      return;
    }
    Logging.warn(logMessage, err);
    this.promptResetApplicationDialog().catch((callbackError) =>
      Logging.warn("onKnownMultiTabCorruption callback failed", callbackError),
    );
  }
}

/**
 * Detect IndexedDB/PouchDB corruption symptoms commonly observed when the app
 * is used in multiple tabs with concurrent writes.
 *
 * We intentionally match on `transaction was aborted` because this is the
 * reliable signal present on the actual error object propagated to app code
 * after IndexedDB global-failure cases. The `unknown_error` label is too
 * generic and may appear for unrelated failures.
 */
export function isKnownMultiTabDatabaseCorruption(error: unknown): boolean {
  const text = errorToText(error).toLowerCase();
  const transactionAbortedMatch = text.includes("transaction was aborted");
  const globalFailureMatch = text.includes("database has a global failure");
  const constraintSeqMatch =
    text.includes("constrainterror") && text.includes("seq");
  const isKnownCorruption =
    transactionAbortedMatch || globalFailureMatch || constraintSeqMatch;

  return isKnownCorruption;
}

function errorToText(error: unknown): string {
  if (error instanceof Error) {
    const errorWithExtras = error as Error & Record<string, unknown>;
    return `${error.name} ${error.message} ${JSON.stringify(errorWithExtras)}`;
  }
  if (typeof error === "string") return error;
  return JSON.stringify(error ?? "");
}
