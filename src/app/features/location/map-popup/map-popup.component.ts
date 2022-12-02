import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";

@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
})
export class MapPopupComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public coordinates: Coordinates) {}

  select(newCoordinates: Coordinates) {
    this.coordinates = newCoordinates;
  }
}
