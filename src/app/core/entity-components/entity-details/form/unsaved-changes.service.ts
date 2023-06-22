import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

/**
 * This service handles the state whether there are currently some unsaved changes in the app.
 * These pending changes might come from a form component or popup.
 * If there are pending changes, certain actions in the app should trigger a user confirmation if the changes should be discarded.
 */
@Injectable({
  providedIn: "root",
})
export class UnsavedChangesService {
  /**
   * Set to true if the user has pending changes that are not yet saved.
   * Set to false once the changes have been saved or discarded.
   */
  pending = false;

  constructor(private confirmation: ConfirmationDialogService) {
    // prevent browser navigation if changes are pending
    window.onbeforeunload = (e) => {
      if (this.pending) {
        e.preventDefault();
        e.returnValue = "onbeforeunload";
      }
    };
  }

  /**
   * Shows a user confirmation popup if there are unsaved changes which will be discarded.
   */
  async checkUnsavedChanges() {
    if (this.pending) {
      const confirmed = await this.confirmation.getDiscardConfirmation();
      if (confirmed) {
        this.pending = false;
        return true;
      } else {
        return false;
      }
    }
    return true;
  }
}
