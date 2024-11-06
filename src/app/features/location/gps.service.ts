import { Injectable } from '@angular/core';
import 'leaflet';
import { GeoService } from './geo.service';

@Injectable({
  providedIn: 'root'
})
export class GpsService {

  constructor(private geoService: GeoService) {}
  location: { lat: number; lon: number; } | null = null;

  getGpsLocationCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log({position}, "==>position")
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            this.location = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
          },
          (error) => {
            reject(`Geolocation error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      } else {
        reject('Geolocation is not supported by this browser.');
      }
    });
  }

  getGpsLocationAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.location) {
        this.geoService.lookup(`${this.location.lat}, ${this.location.lon}`)
          .subscribe((results) => {
            console.log({results}, "==>results")
            if (results.length > 0) {
              resolve(results[0].display_name);
            } else {
              reject('No results found');
            }
          });
        }
      });
    }
}