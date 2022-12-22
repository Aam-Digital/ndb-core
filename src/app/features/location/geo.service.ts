import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Coordinates } from "./coordinates";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "../../core/config/config.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { environment } from "../../../environments/environment";
import { MAP_CONFIG_KEY, MapConfig } from "./map-config";

export interface GeoResult extends Coordinates {
  display_name: string;
}

/**
 * A service that uses nominatim to lookup locations {@link https://nominatim.org/}
 */
@Injectable({
  providedIn: "root",
})
export class GeoService {
  private readonly remoteUrl = "/nominatim";
  private countrycodes = "de";
  private defaultOptions = {
    format: "json",
    addressdetails: 1,
    email: environment.email,
  };

  constructor(
    private http: HttpClient,
    private analytics: AnalyticsService,
    configService: ConfigService
  ) {
    configService.configUpdates.subscribe(() => {
      const config = configService.getConfig<MapConfig>(MAP_CONFIG_KEY);
      if (config?.countrycodes) {
        this.countrycodes = config.countrycodes;
      }
    });
  }

  /**
   * Returns locations that match the search term
   * @param searchTerm e.g. `Rollbergstraße Berlin`
   */
  lookup(searchTerm: string): Observable<GeoResult[]> {
    this.analytics.eventTrack("lookup_executed", {
      category: "Map",
      value: searchTerm.length,
    });
    return this.http.get<GeoResult[]>(`${this.remoteUrl}/search`, {
      params: {
        ...this.defaultOptions,
        q: searchTerm,
        countrycodes: this.countrycodes,
      },
    });
  }

  /**
   * Returns the location at the provided coordinates
   * @param coordinates of a place (`lat` and `lon`)
   */
  reverseLookup(coordinates: Coordinates): Observable<GeoResult> {
    this.analytics.eventTrack("reverse_lookup_executed", {
      category: "Map",
    });
    return this.http.get<GeoResult>(`${this.remoteUrl}/reverse`, {
      params: {
        ...this.defaultOptions,
        lat: coordinates.lat,
        lon: coordinates.lon,
      },
    });
  }
}
