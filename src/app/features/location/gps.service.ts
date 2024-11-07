import { Injectable } from "@angular/core";
import { GeoService } from "./geo.service";

@Injectable({
  providedIn: "root",
})
export class GpsService {
  constructor(private readonly geoService: GeoService) {}
  location: { lat: number; lon: number } | null = null;

  getGpsLocationCoordinates(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> {
    return new Promise(async (resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (
          permissionStatus.state !== "granted" &&
          permissionStatus.state !== "prompt"
        ) {
          reject("Geolocation permission is not granted.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(this.handleGpsLocationPosition(position)),
          (error) => reject(`Geolocation error: ${error.message}`),
        );
      } catch (error) {
        reject("Failed to check geolocation permissions.");
      }
    });
  }

  getGpsLocationAddress(): Promise<string> {
    return new Promise((resolve) => {
      if (this.location) {
        this.geoService
          .lookup(`${this.location.lat}, ${this.location.lon}`)
          .subscribe((results) => {
            if (results.length > 0) {
              resolve(results[0].display_name);
            } else {
              resolve(`Lat: ${this.location.lat}, Lon: ${this.location.lon}`);
            }
          });
      }
    });
  }

  public handleGpsLocationPosition(position: GeolocationPosition): {
    latitude: number;
    longitude: number;
    accuracy: number;
  } {
    this.location = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  }
}
