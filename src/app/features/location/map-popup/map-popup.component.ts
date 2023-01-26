import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { Observable, Subject } from "rxjs";
import { MapComponent } from "../map/map.component";
import { AsyncPipe, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LocationProperties } from "../map/map-properties-popup/map-properties-popup.component";

export interface MapPopupConfig {
  marked?: Observable<Coordinates[]>;
  entities?: Observable<Entity[]>;
  highlightedEntities?: Observable<Entity[]>;
  mapClick?: Subject<Coordinates>;
  entityClick?: Subject<Entity>;
  disabled?: boolean;
  helpText?: string;
  displayedProperties?: LocationProperties;
}

@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
  imports: [MatDialogModule, MapComponent, NgIf, MatButtonModule, AsyncPipe],
  standalone: true,
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
