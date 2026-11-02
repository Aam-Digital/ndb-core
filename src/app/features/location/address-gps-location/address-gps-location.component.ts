import {
  Component,
  inject,
  ChangeDetectionStrategy,
  output,
  signal,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  locationSelected = output<GeoResult>();

  public gpsLoading = signal(false);

  async updateLocationFromGps() {
    this.gpsLoading.set(true);
    try {
      const location = await this.gpsService.getGpsLocationCoordinates();
      if (location) {
        const geoResult: GeoResult = await firstValueFrom(
          this.geoService.reverseLookup(location),
        );
        this.locationSelected.emit(geoResult);
        this.alertService.addInfo(
          $localize`Selected address based on GPS coordinate lookup as ${geoResult?.display_name}`,
        );
      }
    } catch (error) {
      if (isExpectedLocationFailure(error)) {
        Logging.debug("Could not access device location", error);
      } else {
        Logging.warn("Failed to access device location", error);
      }

      this.alertService.addInfo(
        $localize`Failed to access device location. Please check if location permission is enabled in your device settings.`,
      );
    } finally {
      this.gpsLoading.set(false);
    }
  }
}

/**
 * Failures caused by the device rather than a defect: a denied or blocked location
 * permission, no position available or a timeout. The user is told in any case.
 * (A failed address lookup does not get here: `GeoService.reverseLookup` falls back
 * to the plain coordinates.)
 */
function isExpectedLocationFailure(error: unknown): boolean {
  if (
    error instanceof Error &&
    (error.message === "USER_DENIED_PERMISSION" ||
      error.message.startsWith("GPS permission denied"))
  ) {
    return true;
  }
  return (
    typeof GeolocationPositionError !== "undefined" &&
    error instanceof GeolocationPositionError
  );
}
