import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { MatchingSide } from "../matching-entities.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf, NgIf } from "@angular/common";

@Component({
  selector: "app-map-properties-popup",
  templateUrl: "./map-properties-popup.component.html",
  styles: [],
  imports: [
    MatDialogModule,
    DialogCloseComponent,
    MatFormFieldModule,
    MatSelectModule,
    NgForOf,
    NgIf,
  ],
  standalone: true,
})
export class MapPropertiesPopupComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public sideDetails: [MatchingSide, MatchingSide]
  ) {}
}
