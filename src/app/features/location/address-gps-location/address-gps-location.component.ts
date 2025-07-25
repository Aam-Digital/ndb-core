import { Component, EventEmitter, Output, inject } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { GpsService } from "../gps.service";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconButton } from "@angular/material/button";
import { AlertService } from "app/core/alerts/alert.service";
import { GeoResult, GeoService } from "../geo.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-address-gps-location",
  imports: [
    MatTooltip,
    FaIconComponent,
    MatProgressSpinnerModule,
    MatTooltip,
    MatIconButton,
  ],
  templateUrl: "./address-gps-location.component.html",
  styleUrl: "./address-gps-location.component.scss",
})
export class AddressGpsLocationComponent {
  private gpsService = inject(GpsService);
  private alertService = inject(AlertService);
  private geoService = inject(GeoService);

  @Output() locationSelected = new EventEmitter<GeoResult>();

  public gpsLoading = false;

  async updateLocationFromGps() {
    this.gpsLoading = true;
    try {
      const location = await this.gpsService.getGpsLocationCoordinates();
      if (location) {
        const geoResult: GeoResult = await firstValueFrom(
          this.geoService.reverseLookup(location),
        );
        this.locationSelected.emit(geoResult);
        this.alertService.addInfo(
          `Selected address based on GPS coordinate lookup as ${geoResult?.display_name}`,
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "USER_DENIED_PERMISSION"
      ) {
        Logging.debug("User denied location permission");
      } else {
        Logging.warn("Failed to access device location", error);
      }

      this.alertService.addInfo(
        $localize`Failed to access device location. Please check if location permission is enabled in your device settings.`,
      );
    } finally {
      this.gpsLoading = false;
    }
  }
}
