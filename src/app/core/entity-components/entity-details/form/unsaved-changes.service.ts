import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

@Injectable({
  providedIn: "root",
})
export class UnsavedChangesService {
  pending = false;

  constructor(private confirmation: ConfirmationDialogService) {
    // prevent navigation if changes are pending
    window.onbeforeunload = (e) => {
      if (this.pending) {
        e.preventDefault();
        e.returnValue = "onbeforeunload";
      }
    };
  }

  async checkUnsavedChanges() {
    if (this.pending) {
      const confirmed = await this.confirmation.getSaveConfirmation();
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
