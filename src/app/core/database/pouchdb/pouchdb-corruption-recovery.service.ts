import { Injectable, inject } from "@angular/core";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import {
  CustomYesNoButtons,
  OkButton,
} from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { LOCATION_TOKEN } from "#src/app/utils/di-tokens";
import { BackupService } from "../../admin/backup/backup.service";

/**
 * Handles user-facing recovery flows when PouchDB IndexedDB corruption is detected.
 * Shows targeted dialogs and optionally resets the local database to a clean state.
 */
@Injectable({ providedIn: "root" })
export class PouchdbCorruptionRecoveryService {
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly location = inject<Location>(LOCATION_TOKEN);
  private dialogOpen = false;

  async promptMultiTabWarningDialog(): Promise<void> {
    if (this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;

    try {
      await this.confirmationDialog.getConfirmation(
        $localize`:multi-tab warning dialog title:Multiple Tabs Open`,
        $localize`:multi-tab warning dialog text:This action is blocked because the app is open in multiple tabs.

Please close the other tabs and try again to avoid local database corruption.

We are working on improvements to allow this in the future.`,
        OkButton,
        false,
      );
    } finally {
      this.dialogOpen = false;
    }
  }

  async promptResetApplicationDialog(): Promise<void> {
    if (this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;

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
      this.dialogOpen = false;
    }
  }

  private resetApplication() {
    localStorage.clear();
    sessionStorage.setItem(BackupService.RESET_PENDING_KEY, "1");
    this.location.pathname = "";
  }
}
