import { Injectable } from "@angular/core";
import { GeoService } from "./geo.service";
import { LOCATION_PERMISSION_STATUS_GRANTED, LOCATION_PERMISSION_STATUS_PROMPT } from "./map-config";

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
    return new Promise((resolve, reject) => {
      if ("permissions" in navigator && "geolocation" in navigator) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((permissionStatus) => {
            if (permissionStatus.state === LOCATION_PERMISSION_STATUS_GRANTED || permissionStatus.state === LOCATION_PERMISSION_STATUS_PROMPT) {
              navigator.geolocation.getCurrentPosition(
                (position) => resolve(this.handleGpsLocationPosition(position)),
                (error) => reject(`Geolocation error: ${error.message}`),
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 30000,
                }
              );
            } else {
              reject("Location permission denied by the user.");
            }
          })
          .catch(() => {
            reject("Unable to query geolocation permissions.");
          });
      } else {
        reject("Geolocation is not supported by this browser.");
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
