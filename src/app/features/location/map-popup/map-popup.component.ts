import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MapComponent } from "../map/map.component";
import { AsyncPipe, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LocationProperties } from "../map/map-properties-popup/map-properties-popup.component";
import { AddressSearchComponent } from "../address-search/address-search.component";
import { GeoResult } from "../geo.service";

export interface MapPopupConfig {
  marked?: Coordinates[];
  entities?: Observable<Entity[]>;
  highlightedEntities?: Observable<Entity[]>;
  entityClick?: Subject<Entity>;
  disabled?: boolean;
  displayedProperties?: LocationProperties;

  /**
   * Display a custom help text in the dialog to explain possible actions.
   * (Otherwise the default help is shown)
   */
  helpText?: string;

  /**
   * Prefill the address search box with this text
   */
  initialSearchText?: string;
}

@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
  imports: [
    MatDialogModule,
    MapComponent,
    NgIf,
    MatButtonModule,
    AsyncPipe,
    AddressSearchComponent,
  ],
  standalone: true,
})
export class MapPopupComponent {
  markedLocations: BehaviorSubject<GeoResult[]>;
  helpText: string = $localize`Search an address or click on the map directly to select a different location`;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: MapPopupConfig,
  ) {
    this.markedLocations = new BehaviorSubject<GeoResult[]>(
      (data.marked as GeoResult[]) ?? [],
    );
    if (data.hasOwnProperty("helpText")) {
      this.helpText = data.helpText;
    }
  }

  mapClicked(newCoordinates: Coordinates) {
    if (this.data.disabled) {
      return;
    }
    const geoResult: GeoResult = {
      ...newCoordinates,
      display_name: $localize`[selected on map: ${newCoordinates.lat} - ${newCoordinates.lon}]`,
    };
    this.updateLocation(geoResult);
  }

  updateLocation(event: GeoResult) {
    this.markedLocations.next([event]);
  }
}
