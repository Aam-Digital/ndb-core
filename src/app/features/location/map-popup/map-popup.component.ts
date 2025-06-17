import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { BehaviorSubject, firstValueFrom, Observable, Subject } from "rxjs";
import { MapComponent } from "../map/map.component";
import { AsyncPipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { GeoService, GeoResult } from "../geo.service";
import { AddressEditComponent } from "../address-edit/address-edit.component";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { LocationProperties } from "../map/map-properties-popup/map-properties-popup.component";
import { GeoLocation } from "../geo-location";

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
   * A single location that is selected and editable.
   */
  selectedLocation?: GeoLocation;
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
    AddressEditComponent,
  ],
})
export class MapPopupComponent {
  markedLocations: BehaviorSubject<GeoResult[]>;
  helpText: string = $localize`Search an address or click on the map directly to select a different location`;

  selectedLocation: GeoLocation;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MapPopupConfig,
    private dialogRef: MatDialogRef<MapPopupComponent>,
    private geoService: GeoService,
    private confirmationDialog: ConfirmationDialogService,
  ) {
    this.markedLocations = new BehaviorSubject<GeoResult[]>(
      (data.marked as GeoResult[]) ?? [],
    );
    this.selectedLocation = data.selectedLocation;
    if (
      this.selectedLocation &&
      this.selectedLocation.geoLookup &&
      !this.markedLocations.value
        .filter((x) => !!x)
        .includes(this.selectedLocation.geoLookup)
    ) {
      this.markedLocations.next([
        ...this.markedLocations.value,
        this.selectedLocation.geoLookup,
      ]);
    }

    if (!data.disabled) {
      this.dialogRef.disableClose = true;
    }

    if (data.hasOwnProperty("helpText")) {
      this.helpText = data.helpText!;
    }
  }

  async mapClicked(newCoordinates: Coordinates) {
    if (this.data.disabled || !newCoordinates) {
      return;
    }
    const geoResult: GeoResult = await firstValueFrom(
      this.geoService.reverseLookup(newCoordinates),
    );

    const manualAddress = this.selectedLocation?.locationString ?? "";
    const lookupAddress = geoResult?.display_name ?? "";

    if (manualAddress && manualAddress !== lookupAddress) {
      // Show confirmation dialog
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`Address details captured does not match with the location on the map.`,
        $localize`Do you want to continue or edit the address?`,
        [
          {
            text: $localize`Continue`,
            click: () => true,
          },
          {
            text: $localize`Edit Address`,
            click: () => false,
          },
        ],
      );

      if (confirmed) {
        // Continue: Save manual address with new geoLookup
        this.updateLocation({
          geoLookup: geoResult,
          locationString: manualAddress,
        });
      } else {
        // Edit Address: Save new geoLookup and update address string to match
        this.updateLocation({
          geoLookup: geoResult,
          locationString: lookupAddress,
        });
      }
      return;
    }

    // Default: update both
    this.updateLocation({
      geoLookup: geoResult,
      locationString: lookupAddress,
    });
  }

  updateLocation(event: GeoLocation) {
    this.selectedLocation = event;
    this.markedLocations.next(event?.geoLookup ? [event.geoLookup] : []);
  }
}
