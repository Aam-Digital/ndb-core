import { Component, inject } from "@angular/core";
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
import { GeoResult, GeoService } from "../geo.service";
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

  markedLocations: BehaviorSubject<GeoResult[]>;
  helpText: string = $localize`Search an address or click on the map directly to select a different location`;

  selectedLocation: GeoLocation;
  private lastSavedLocation: GeoLocation | undefined;
  private manualAddressJustEdited = false;

  constructor() {
    const data = this.data;

    this.markedLocations = new BehaviorSubject<GeoResult[]>(
      (data.marked as GeoResult[]) ?? [],
    );
    this.selectedLocation = data.selectedLocation;
    this.lastSavedLocation = data.selectedLocation
      ? { ...data.selectedLocation }
      : undefined;
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
    const geoResult: GeoResult = await firstValueFrom(
      this.geoService.reverseLookup(newCoordinates),
    );

    // Only update geoLookup, keep the user's address string as-is
    this.updateLocation({
      ...this.selectedLocation,
      geoLookup: geoResult,
    });
  }

  async onSave() {
    if (this.isUnchanged()) {
      this.closeDialog();
      return;
    }

    const manualAddress = this.selectedLocation?.locationString ?? "";
    const lookupAddress = this.selectedLocation?.geoLookup?.display_name ?? "";

    if (this.shouldShowConfirmation(manualAddress, lookupAddress)) {
      const result = await this.showAddressMismatchDialog();
      await this.handleConfirmationResult(result, lookupAddress);
      return;
    }

    this.saveAndClose();
  }

  private isUnchanged(): boolean {
    return (
      JSON.stringify(this.selectedLocation) ===
      JSON.stringify(this.lastSavedLocation)
    );
  }

  private shouldShowConfirmation(
    manualAddress: string,
    lookupAddress: string,
  ): boolean {
    return (
      manualAddress &&
      manualAddress !== lookupAddress &&
      !this.manualAddressJustEdited
    );
  }

  private async showAddressMismatchDialog(): Promise<
    "continue" | "update" | undefined
  > {
    const result = await this.confirmationDialog.getConfirmation(
      $localize`Address Mismatch`,
      $localize`Address details captured does not match with the location on the map. What would you like to do?`,
      [
        {
          text: $localize`Continue (with old address)`,
          dialogResult: "continue",
          click: () => {},
        },
        {
          text: $localize`Update to new address`,
          dialogResult: "update",
          click: () => {},
        },
      ],
    );
    return result as "continue" | "update" | undefined;
  }

  private async handleConfirmationResult(
    result: string | boolean | undefined,
    lookupAddress: string,
  ) {
    if (result === "continue") {
      this.saveAndClose();
    } else if (result === "update") {
      this.selectedLocation = {
        ...this.selectedLocation,
        locationString: lookupAddress,
      };
      this.saveAndClose();
    }
    // If dialog closed without a result, do nothing (let user edit)
  }

  private saveAndClose() {
    this.lastSavedLocation = { ...this.selectedLocation };
    this.manualAddressJustEdited = false;
    this.closeDialog();
  }

  private closeDialog() {
    this.dialogRef.close([this.selectedLocation]);
  }

  updateLocation(event: GeoLocation) {
    // Detect if manual address was just edited
    if (
      this.selectedLocation?.locationString !== event?.locationString &&
      event?.locationString !== event?.geoLookup?.display_name
    ) {
      this.manualAddressJustEdited = true;
    }
    this.selectedLocation = event;
    this.markedLocations.next(event?.geoLookup ? [event.geoLookup] : []);
  }
}
