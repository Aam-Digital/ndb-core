import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GpsService {
  constructor() {}

  async getGpsLocationCoordinates(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> {
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

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(this.handleGpsLocationPosition(position)),
        (error) => reject(error),
      );
    });
  }

  handleGpsLocationPosition(position: GeolocationPosition): {
    latitude: number;
    longitude: number;
    accuracy: number;
  } {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  }
}
