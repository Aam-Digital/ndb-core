import { Component, Inject } from "@angular/core";
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
  standalone: true,
})
export class ShowFileComponent {
  constructor(@Inject(MAT_DIALOG_DATA) private link: string) {}

  showFile(): void {
    window.open(this.link, "_blank");
  }
}
