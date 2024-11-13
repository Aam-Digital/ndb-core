import { Component } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { GpsService } from "../gps.service";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconButton } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { MapPopupComponent } from "../map-popup/map-popup.component";
import { Coordinates } from "../coordinates";
import { AlertService } from "app/core/alerts/alert.service";

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
  constructor(
    private gpsService: GpsService,
    private mapPopupComponent: MapPopupComponent,
    private alertService: AlertService,
  ) {}
  location: Coordinates;
  public gpsLoading = false;

  async updateLocationFromGps() {
    this.gpsLoading = true;
    try {
      const location = await this.gpsService.getGpsLocationCoordinates();
      if (location) {
        this.location = {
          lat: location.latitude,
          lon: location.longitude,
        };
        await this.mapPopupComponent.mapClicked(this.location);
        this.alertService.addInfo("Location updated from GPS.");
      }
    } catch (error) {
      Logging.error("Failed to get GPS location", error);
      this.alertService.addAlert(error);
    } finally {
      this.gpsLoading = false;
    }
  }
}
