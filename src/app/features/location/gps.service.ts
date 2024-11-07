import { Injectable } from "@angular/core";
import { GeoService } from "./geo.service";

@Injectable({
  providedIn: "root",
})
export class GpsService {
  constructor(private readonly geoService: GeoService) {}
  location: { lat: number; lon: number } | null = null;

  async getGpsLocationCoordinates(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> {
    if (!("geolocation" in navigator)) {
      return;
    }

    const permissionStatus = await navigator.permissions.query({
      // eslint-disable-next-line prettier/prettier
      name: "geolocation", //NOSONAR geolocation is necessary
    });
    if (
      permissionStatus.state !== "granted" &&
      permissionStatus.state !== "prompt"
    ) {
      return;
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line prettier/prettier
      navigator.geolocation.getCurrentPosition( //NOSONAR geolocation is necessary
        (position) => resolve(this.handleGpsLocationPosition(position)),
        (error) => reject(`Geolocation error: ${error.message}`),
      );
    });
  }

  async getGpsLocationAddress(): Promise<string> {
    if (this.location) {
      return new Promise((resolve) => {
        this.geoService
          .lookup(`${this.location.lat}, ${this.location.lon}`)
          .subscribe((results) => {
            if (results.length > 0) {
              resolve(results[0].display_name);
            } else {
              resolve(`Lat: ${this.location.lat}, Lon: ${this.location.lon}`);
            }
          });
      });
    }
    return;
  }

  handleGpsLocationPosition(position: GeolocationPosition): {
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
