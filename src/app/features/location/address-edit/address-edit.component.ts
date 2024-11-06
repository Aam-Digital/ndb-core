import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { AddressSearchComponent } from "../address-search/address-search.component";
import { GeoResult } from "../geo.service";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { GeoLocation } from "../location.datatype";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { GpsService } from "../gps.service";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { NgIf } from "@angular/common";

/**
 * Edit a GeoLocation / Address, including options to search via API and customize the string location being saved.
 */
@Component({
  selector: "app-address-edit",
  standalone: true,
  imports: [
    NgIf,
    MatButton,
    AddressSearchComponent,
    MatFormField,
    MatLabel,
    MatInput,
    MatHint,
    MatTooltip,
    MatIconButton,
    FaIconComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./address-edit.component.html",
  styleUrl: "./address-edit.component.scss",
})
export class AddressEditComponent {
  /**
   * Whenever the user selects an actual looked up location, it is emitted here.
   */
  @Output() selectedLocationChange = new EventEmitter<GeoLocation>();
  /**
   * The initially pre-selected location (displayed in addition to the search field allowing to change it).
   */
  @Input() selectedLocation: GeoLocation;

  /**
   * Whether the search box is enabled and visible.
   */
  @Input() disabled: boolean;

  manualAddressEnabled: boolean;

  constructor(private confirmationDialog: ConfirmationDialogService, private gpsService: GpsService) {}
  public gpsLoading = false;
  error: string | null = null;

  updateLocation(selected: GeoLocation | undefined) {
    this.selectedLocation = selected;
    this.selectedLocationChange.emit(selected);
    this.manualAddressEnabled =
      this.selectedLocation?.geoLookup?.display_name !==
      this.selectedLocation?.locationString;
  }

  clearLocation() {
    this.updateLocation(undefined);
  }

  updateLocationString(value: string) {
    const manualAddress: string = value ?? "";
    if (manualAddress === "" && this.selectedLocation?.geoLookup) {
      this.clearLocation();
      // possible alternative UX: ask user if they want to remove the mapped location also? or update the location with the display_location?
      return;
    }

    this.updateLocation({
      locationString: manualAddress,
      geoLookup: this.selectedLocation?.geoLookup,
    });
  }

  useGps() {
    this.gpsLoading = true;
    this.gpsService.getGpsLocationCoordinates()
      .then(location => {
        return this.gpsService.getGpsLocationAddress().then(address => {
          this.updateLocation({
            locationString: address,
            geoLookup: {
              lat: location.latitude,
              lon: location.longitude,
              display_name: address,
            },
          });
          this.gpsLoading = false;
        });
      })
      .catch(error => {
        this.gpsLoading = false;
        this.error = error;
      });
  }

  async updateFromAddressSearch(
    value: GeoLocation | undefined,
    skipConfirmation: boolean = false,
  ) {
    if (
      value?.geoLookup === this.selectedLocation?.geoLookup &&
      value?.locationString === this.selectedLocation?.locationString
    ) {
      // nothing changed, skip
      return;
    }

    let manualAddress: string = this.selectedLocation?.locationString ?? "";
    let lookupAddress: string =
      value?.locationString ?? value?.geoLookup?.display_name ?? "";
    if (manualAddress === "") {
      // auto-apply lookup location for empty field
      manualAddress = lookupAddress;
    }

    if (manualAddress !== lookupAddress) {
      if (
        // if manualAddress has been automatically set before, we assume the user wants to auto update now also
        manualAddress === this.selectedLocation?.geoLookup?.display_name ||
        // otherwise ask user if they want to apply the lookup location
        (!skipConfirmation &&
          (await this.confirmationDialog.getConfirmation(
            $localize`Update custom address?`,
            $localize`Do you want to overwrite the custom address to the full address from the online lookup? This will replace "${manualAddress}" with "${lookupAddress}". The marked location on the map will be unaffected by this choice.`,
          )))
      ) {
        manualAddress = lookupAddress;
      }
    }

    this.updateLocation({
      locationString: manualAddress,
      geoLookup: value?.geoLookup,
    });
  }
}

function matchGeoResults(a: GeoResult, b: GeoResult) {
  return a.lat === b.lat && a.lon === b.lon;
}
