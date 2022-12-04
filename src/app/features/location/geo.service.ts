import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Coordinates } from "./coordinates";
import { HttpClient } from "@angular/common/http";

export interface GeoResult extends Coordinates {
  display_name: string;
}

/**
 * A service that uses nominatim to lookup locations {@link https://nominatim.org/}
 * TODO maybe include email in requests {@link https://nominatim.org/release-docs/develop/api/Reverse/#other}
 */
@Injectable({
  providedIn: "root",
})
export class GeoService {
  readonly remoteUrl = "https://nominatim.openstreetmap.org";

  constructor(private http: HttpClient) {}

  /**
   * Returns locations that match the search term
   * @param searchTerm e.g. `Rollbergstraße Berlin`
   * TODO countrycodes should come from the datatype?
   * @param countrycodes see {@link https://nominatim.org/release-docs/develop/api/Search/#result-limitation}
   */
  lookup(searchTerm: string, countrycodes = "de"): Observable<GeoResult[]> {
    return this.http.get<GeoResult[]>(`${this.remoteUrl}/search`, {
      params: {
        q: searchTerm,
        format: "json",
        countrycodes,
      },
    });
  }

  /**
   * Returns the location at the provided coordinates
   * @param coordinates of a place (`lat` and `lon`)
   */
  reverseLookup(coordinates: Coordinates): Observable<GeoResult> {
    return this.http.get<GeoResult>(`${this.remoteUrl}/reverse`, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        format: "json",
      },
    });
  }
}
