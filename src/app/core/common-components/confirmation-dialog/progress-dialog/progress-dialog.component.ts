import { Component, inject } from "@angular/core";
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
  data = inject<{
    message: string;
}>(MAT_DIALOG_DATA);
}
