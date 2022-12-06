import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";

@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
})
export class MapPopupComponent {
  coordinates: Coordinates;
  disabled = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      coordinates: Coordinates;
      disabled?: boolean;
    }
  ) {
    this.coordinates = data.coordinates;
    this.disabled = !!data.disabled;
  }

  select(newCoordinates: Coordinates) {
    if (this.disabled) {
      return;
    }
    this.coordinates = newCoordinates;
  }
}
