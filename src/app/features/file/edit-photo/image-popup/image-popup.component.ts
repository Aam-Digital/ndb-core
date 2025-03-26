import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";

@Component({
  selector: "app-image-popup",
  imports: [CommonModule, DialogCloseComponent, MatDialogModule],
  templateUrl: "./image-popup.component.html",
  styleUrls: ["./image-popup.component.scss"],
})
export class ImagePopupComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {}
}
