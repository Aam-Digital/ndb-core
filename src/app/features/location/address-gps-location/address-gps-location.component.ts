import { Component, EventEmitter, Output } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { GpsService } from "../gps.service";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconButton } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { Coordinates } from "../coordinates";
import { AlertService } from "app/core/alerts/alert.service";
import { GeoResult, GeoService } from "../geo.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-address-gps-location",
  standalone: true,
  imports: [
    MatTooltip,
    FaIconComponent,
    MatProgressSpinnerModule,
    NgIf,
    MatTooltip,
    MatIconButton,
  ],
  templateUrl: "./address-gps-location.component.html",
  styleUrl: "./address-gps-location.component.scss",
})
export class AddressGpsLocationComponent {
  @Output() locationSelected = new EventEmitter<GeoResult>();

  public gpsLoading = false;
  location: Coordinates;

  constructor(
    private gpsService: GpsService,
    private alertService: AlertService,
    private geoService: GeoService,
  ) {}

  async updateLocationFromGps() {
    this.gpsLoading = true;
    try {
      const location = await this.gpsService.getGpsLocationCoordinates();
      if (location) {
        this.location = {
          lat: location.latitude,
          lon: location.longitude,
        };
        const geoResult: GeoResult = await firstValueFrom(
          this.geoService.reverseLookup(this.location),
        );
        this.locationSelected.emit(geoResult);
        this.alertService.addInfo(
          `Selected address based on GPS coordinate lookup as ${geoResult?.display_name}`,
        );
      }
    } catch (error) {
      Logging.error(error);
      this.alertService.addInfo(
        $localize`Failed to access device location. Please check if location permission is enabled in your device settings`,
      );
    } finally {
      this.gpsLoading = false;
    }
  }
}
