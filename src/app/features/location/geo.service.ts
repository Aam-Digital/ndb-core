import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Coordinates } from "./coordinates";
import { HttpClient } from "@angular/common/http";

export interface GeoResult extends Coordinates {
  display_name: string;
}

@Injectable({
  providedIn: "root",
})
// TODO maybe include email in requests {@link https://nominatim.org/release-docs/develop/api/Reverse/#other}
export class GeoService {
  readonly remoteUrl = "https://nominatim.openstreetmap.org";

  constructor(private http: HttpClient) {}

  lookup(searchTerm: string): Observable<GeoResult[]> {
    return this.http.get<GeoResult[]>(`${this.remoteUrl}/search`, {
      params: {
        q: searchTerm,
        format: "json",
        // TODO make this configurable
        countrycodes: "de",
      },
    });
  }

  reverseLookup(coordinates: Coordinates): Observable<GeoResult> {
    return this.http.get<GeoResult>(`${this.remoteUrl}/reverse`, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        addressdetails: 0,
        format: "json",
        // TODO make this configurable
        countrycodes: "de",
      },
    });
  }
}
