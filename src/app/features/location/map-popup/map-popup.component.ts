import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { BehaviorSubject, firstValueFrom, Observable, of, Subject } from "rxjs";
import { MapComponent } from "../map/map.component";
import { AsyncPipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LocationProperties } from "../map/map-properties-popup/map-properties-popup.component";
import { AddressSearchComponent } from "../address-search/address-search.component";
import { GeoResult, GeoService } from "../geo.service";
import { catchError, map } from "rxjs/operators";

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

/**
 * A dialog to display an OpenStreetMap map with markers and optionally allow the user to select a location.
 */
@Component({
  selector: "app-map-popup",
  templateUrl: "./map-popup.component.html",
  styleUrls: ["./map-popup.component.scss"],
  imports: [
    MatDialogModule,
    MapComponent,
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
    private geoService: GeoService,
  ) {
    this.markedLocations = new BehaviorSubject<GeoResult[]>(
      (data.marked as GeoResult[]) ?? [],
    );
    if (data.hasOwnProperty("helpText")) {
      this.helpText = data.helpText;
    }
  }

  async mapClicked(newCoordinates: Coordinates) {
    if (this.data.disabled) {
      return;
    }
    const geoResult: GeoResult = await firstValueFrom(
      this.lookupCoordinates(newCoordinates),
    );
    this.updateLocation(geoResult);
  }

  private lookupCoordinates(coords: Coordinates) {
    if (!coords) {
      return undefined;
    }

    const fallback: GeoResult = {
      display_name: $localize`[selected on map: ${coords.lat} - ${coords.lon}]`,
      ...coords,
    };
    return this.geoService.reverseLookup(coords).pipe(
      map((res) => (res["error"] ? fallback : res)),
      catchError(() => of(fallback)),
    );
  }

  updateLocation(event: GeoResult) {
    this.markedLocations.next([event]);
  }
}
