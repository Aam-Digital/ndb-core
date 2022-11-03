import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-show-file",
  templateUrl: "./show-file.component.html",
  styleUrls: ["./show-file.component.scss"],
})
export class ShowFileComponent {
  constructor(@Inject(MAT_DIALOG_DATA) private link: string) {}

  showFile(): void {
    window.open(this.link, "_blank");
  }
}
