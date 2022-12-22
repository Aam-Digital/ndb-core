import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { Observable, Subject } from "rxjs";
import { LocationEntity } from "../map/map.component";

export interface MapPopupConfig {
  marked?: Observable<Coordinates[]>;
  entities?: Observable<LocationEntity[]>;
  highlightedEntities?: Observable<LocationEntity[]>;
  mapClick?: Subject<Coordinates>;
  entityClick?: Subject<Entity>;
  disabled?: boolean;
  helpText?: string;
}

@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
})
export class MapPopupComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: MapPopupConfig
  ) {}

  mapClicked(newCoordinates: Coordinates) {
    if (this.data.disabled) {
      return;
    }
    this.data.mapClick?.next(newCoordinates);
  }
}
