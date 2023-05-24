import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

@Injectable({
  providedIn: "root",
})
export class UnsavedChangesService {
  pending = false;

  constructor(private confirmation: ConfirmationDialogService) {
    // prevent navigation if changes are pending
    window.onbeforeunload = () => (this.pending ? "" : undefined);
  }

  async checkUnsavedChanges() {
    if (this.pending) {
      const confirmed = await this.confirmation.getConfirmation(
        "Discard changes?",
        "You have unsaved changes. Do you really want to leave this page? All unsaved changes will be lost."
      );
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
