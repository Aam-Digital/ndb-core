import { Injectable } from "@angular/core";
import { Coordinates } from "./coordinates";

/**
 * Access the device's GPS sensor to get the current location.
 */
@Injectable({
  providedIn: "root",
})
export class GpsService {
  constructor() {}

  async getGpsLocationCoordinates(): Promise<Coordinates> {
    if (!("geolocation" in navigator) || !navigator.geolocation) {
      return;
    }

    const permissionStatus = await navigator.permissions.query({
      name: "geolocation",
    });

    if (
      permissionStatus.state !== "granted" &&
      permissionStatus.state !== "prompt"
    ) {
      throw new Error(
        "GPS permission denied or blocked. Please enable it in your device settings.",
      );
    }

    const position: GeolocationPosition = await new Promise(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
        );
      },
    );

    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  }
}
