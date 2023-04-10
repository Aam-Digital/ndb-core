import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../../common-components/dialog-close/dialog-close.component";

@Component({
  selector: "app-image-popup",
  standalone: true,
  imports: [CommonModule, DialogCloseComponent],
  templateUrl: "./image-popup.component.html",
  styleUrls: ["./image-popup.component.scss"],
})
export class ImagePopupComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {}
}
