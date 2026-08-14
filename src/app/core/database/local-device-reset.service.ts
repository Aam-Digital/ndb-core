import { inject, Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { LOCAL_STORAGE_TOKEN, LOCATION_TOKEN } from "../../utils/di-tokens";
import { Logging } from "../logging/logging.service";
import { RESET_PENDING_KEY } from "#src/bootstrap-reset";

/**
 * Clear all data cached on the current device and re-synchronize it from the server.
 *
 * This only affects this device, not the server or other users,
 * and is therefore also offered to normal users (e.g. in the support page)
 * rather than being an admin action like the SystemResetService ones.
 *
 * This service only marks the reset as pending and reloads the page;
 * the actual cleanup runs in `runPendingReset()` during the next bootstrap.
 */
@Injectable({
  providedIn: "root",
})
export class LocalDeviceResetService {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly location = inject(LOCATION_TOKEN);

  /**
   * Ask the user for confirmation and then wipe this device's local data.
   */
  async resetLocalDevice(): Promise<void> {
    const choice = await this.confirmationDialog.getConfirmation(
      $localize`:Reset Application Confirmation:Reset local data on this device?`,
      $localize`:Reset Application Confirmation:Are you sure you want to clear all data cached on this device and re-synchronize from the server? This does not affect the server or other users. Any changes on this device that have not yet been synchronised will be lost.`,
    );
    if (!choice) {
      return;
    }

    // deleting ALL local data (incl. possibly unsynced docs) - log for traceability of possible data loss
    Logging.warn(
      "Resetting application: user confirmed deletion of all local data",
    );

    this.localStorage.clear();
    this.markResetPendingAndReload();
  }

  /**
   * Trigger the actual reset of the local databases.
   *
   * The page is reloaded first to kill all PouchDB connections, in-flight sync,
   * view indexing, and other async operations. The IDB databases are deleted on
   * the fresh page by `runPendingReset()` (before Angular bootstraps) where no
   * connections exist, avoiding race conditions with PouchDB's IDB transactions.
   *
   * Use this directly (instead of {@link resetLocalDevice}) where the reset is not
   * triggered by the user asking for it, e.g. to recover from a corrupted database.
   */
  markResetPendingAndReload(): void {
    sessionStorage.setItem(RESET_PENDING_KEY, "1");
    this.location.pathname = "";
  }
}
