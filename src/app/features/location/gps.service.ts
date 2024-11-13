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
    if (!("geolocation" in navigator)) {
      return;
    }

    const permissionStatus = await navigator.permissions.query({
      name: "geolocation",
    });

    if (
      permissionStatus.state !== "granted" &&
      permissionStatus.state !== "prompt"
    ) {
      throw new Error("GPS permission denied or blocked.");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(this.handleGpsLocationPosition(position)),
        (error) => {
          const errorMessage = this.getGpsErrorMessage(error);
          reject(errorMessage);
        },
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

  getGpsErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "GPS permission denied. Please enable it in your device settings.";
      case error.POSITION_UNAVAILABLE:
        return "Unable to retrieve location.";
      case error.TIMEOUT:
        return "GPS request timed out. Please try again.";
      default:
        return `Geolocation error: ${error.message}`;
    }
  }
}
