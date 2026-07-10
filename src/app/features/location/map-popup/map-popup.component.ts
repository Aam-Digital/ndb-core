import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
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
import { OpenStreetMapsSearchResult, GeoService } from "../geo.service";
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

  /**
   * If true, show a minimal map view with only pins and a close button for selection-only use cases.
   * Hides the address input, search, and save/cancel buttons.
   */
  showMapOnly?: boolean;
}

/**
 * A dialog to display an OpenStreetMap map with markers and optionally allow the user to select a location.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  data = inject<MapPopupConfig>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<MapPopupComponent>>(MatDialogRef);
  private geoService = inject(GeoService);
  private confirmationDialog = inject(ConfirmationDialogService);

  markedLocations: BehaviorSubject<OpenStreetMapsSearchResult[]>;
  helpText: string = $localize`Search an address or click on the map directly to select a different location`;

  selectedLocation: GeoLocation;

  constructor() {
    const data = this.data;

    this.markedLocations = new BehaviorSubject<OpenStreetMapsSearchResult[]>(
      (data.marked as OpenStreetMapsSearchResult[]) ?? [],
    );
    this.selectedLocation = data.selectedLocation;
    this.ensureGeoLookupInMarkedLocations();
    this.setDialogCloseBehavior(data);
    this.setHelpText(data);
  }

  private ensureGeoLookupInMarkedLocations() {
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
  }

  private setDialogCloseBehavior(data: MapPopupConfig) {
    if (!data.disabled) {
      this.dialogRef.disableClose = true;
    }
  }

  private setHelpText(data: MapPopupConfig) {
    if (data.hasOwnProperty("helpText")) {
      this.helpText = data.helpText;
    }
  }

  async mapClicked(newCoordinates: Coordinates) {
    if (this.data.disabled || !newCoordinates) {
      return;
    }
    const geoResult: OpenStreetMapsSearchResult = await firstValueFrom(
      this.geoService.reverseLookup(newCoordinates),
    );

    // A map click always moves the pin. If there is already an address text or
    // structured details, ask whether to overwrite them with the new location;
    // otherwise just adopt the new location.
    const hasExistingAddress =
      !!this.selectedLocation?.locationString ||
      !!this.geoService.composeAddressFromParts(this.selectedLocation);

    if (hasExistingAddress) {
      const result = await this.confirmationDialog.getConfirmation(
        $localize`Update address to this location?`,
        $localize`You selected a new location on the map. Do you want to update the address text and details to this new spot?`,
        [
          {
            text: $localize`Keep current text & details`,
            dialogResult: "keep",
            click: () => {},
          },
          {
            text: $localize`Update to new location`,
            dialogResult: "update",
            click: () => {},
          },
        ],
      );

      if (result !== "update") {
        // Move the pin only; keep the existing text and structured parts exactly
        // as they are (do NOT enrich, which would fill empty parts from the new
        // lookup — the user declined to adopt the new location's details).
        this.selectedLocation = {
          ...this.selectedLocation,
          geoLookup: geoResult,
        };
        this.markedLocations.next([geoResult]);
        return;
      }
    }

    // Adopt the new location fully: text and parts are re-derived from the
    // fresh lookup (old parts are intentionally dropped).
    this.updateLocation({ geoLookup: geoResult });
  }

  onSave() {
    // All divergence between the address text, the structured parts and the
    // mapped location is now resolved at the moment of each edit (part edits
    // and map clicks ask immediately), so saving just persists the result.
    this.closeDialog();
  }

  private closeDialog() {
    this.dialogRef.close([this.selectedLocation]);
  }

  updateLocation(event: GeoLocation | undefined) {
    let updatedLocation = this.geoService.enrichGeoLocation(event);

    const displayName = updatedLocation?.geoLookup?.display_name;
    const hasManualAddress =
      updatedLocation?.locationString !== undefined &&
      updatedLocation?.locationString !== null &&
      updatedLocation?.locationString !== "";

    if (displayName && !hasManualAddress) {
      updatedLocation = {
        ...(updatedLocation ?? {}),
        locationString: displayName,
      };
    }

    this.selectedLocation = updatedLocation;
    this.markedLocations.next(
      updatedLocation?.geoLookup ? [updatedLocation.geoLookup] : [],
    );
  }
}
