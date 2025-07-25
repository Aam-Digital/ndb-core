import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

/**
 * This simple component can be used to open a file in a new window, if the user's browser is blocking popups.
 */
@Component({
  selector: "app-show-file",
  templateUrl: "./show-file.component.html",
  styleUrls: ["./show-file.component.scss"],
  imports: [MatDialogModule, MatButtonModule],
})
export class ShowFileComponent {
  private link = inject(MAT_DIALOG_DATA);

  showFile(): void {
    window.open(this.link, "_blank");
  }
}
