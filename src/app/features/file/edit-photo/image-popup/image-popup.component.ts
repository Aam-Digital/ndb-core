import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";

@Component({
  selector: "app-image-popup",
  imports: [DialogCloseComponent, MatDialogModule],
  templateUrl: "./image-popup.component.html",
  styleUrls: ["./image-popup.component.scss"],
})
export class ImagePopupComponent {
  data = inject<{
    url: string;
  }>(MAT_DIALOG_DATA);
}
