import { Component, inject, Signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * A simple progress indicator dialog
 * used via the {@link ConfirmationDialogService}.
 */
@Component({
  templateUrl: "./progress-dialog.component.html",
  imports: [MatProgressBarModule, MatDialogModule],
})
export class ProgressDialogComponent {
  private initialData = inject<{
    message: Signal<string>;
  }>(MAT_DIALOG_DATA);

  // Use signal for reactive message updates
  message: Signal<string> = this.initialData.message;
}
