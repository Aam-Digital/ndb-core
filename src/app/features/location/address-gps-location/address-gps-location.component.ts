import { Component } from '@angular/core';
import { Logging } from 'app/core/logging/logging.service';
import { GpsService } from '../gps.service';
import { AddressEditComponent } from '../address-edit/address-edit.component';
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconButton } from "@angular/material/button";
import { NgIf } from "@angular/common";

@Component({
  selector: 'app-address-gps-location',
  standalone: true,
  imports: [
    MatTooltip,
    FaIconComponent,
    MatProgressSpinnerModule,
    NgIf,
    MatTooltip,
    MatIconButton,
  ],
  templateUrl: './address-gps-location.component.html',
  styleUrl: './address-gps-location.component.scss'
})
export class AddressGpsLocationComponent {

  constructor(
    private gpsService: GpsService,
    private addressEditComponent: AddressEditComponent,
  ) {}
  public gpsLoading = false;

  async updateLocationFromGps() {
    this.gpsLoading = true;
    try {
      const location = await this.gpsService.getGpsLocationCoordinates();
      const address = await this.gpsService.getGpsLocationAddress();

      this.addressEditComponent.updateLocation({
        locationString: address,
        geoLookup: {
          lat: location.latitude,
          lon: location.longitude,
          display_name: address,
        },
      });
    } catch (error) {
      Logging.error("Failed to get GPS location", error);
    } finally {
      this.gpsLoading = false;
    }
  }

}
