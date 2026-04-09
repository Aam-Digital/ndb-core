import { Component, inject, Signal, ChangeDetectionStrategy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * A simple progress indicator dialog
 * used via the {@link ConfirmationDialogService}.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./progress-dialog.component.html",
  imports: [MatProgressBarModule, MatDialogModule],
})
export class ProgressDialogComponent {
  private readonly initialData = inject<{
    message: Signal<string>;
  }>(MAT_DIALOG_DATA);

  message = this.initialData.message;
}
