import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { Coordinates } from "./coordinates";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "../../core/config/config.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { environment } from "../../../environments/environment";
import { MAP_CONFIG_KEY, MapConfig } from "./map-config";
import { catchError, map } from "rxjs/operators";

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
    configService: ConfigService,
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
    return this.http
      .get<OpenStreetMapsSearchResult[]>(`${this.remoteUrl}/search`, {
        params: {
          ...this.defaultOptions,
          q: searchTerm,
          countrycodes: this.countrycodes,
        },
      })
      .pipe(
        map((results) =>
          Array.isArray(results)
            ? results.map((x) => this.reformatDisplayName(x))
            : [],
        ),
      );
  }

  private getCity(addr: any): string {
    return addr.city ?? addr.town ?? "";
  }

  private formatStreet(addr: any): string {
    if (!addr.road && !addr.house_number) return "";
    if (addr.road && addr.house_number)
      return `${addr.road} ${addr.house_number}`;
    return addr.road || addr.house_number || "";
  }

  private formatPostcodeCity(addr: any): string {
    const city = this.getCity(addr);
    if (addr.postcode && city) return `${addr.postcode} ${city}`;
    if (addr.postcode) return `${addr.postcode}`;
    if (city) return city;
    return "";
  }

  reformatDisplayName(result: OpenStreetMapsSearchResult): GeoResult {
    const addr = result?.address;
    if (addr) {
      const displayParts = [
        addr.amenity ?? addr.office,
        this.formatStreet(addr),
        this.formatPostcodeCity(addr),
      ].filter((x) => !!x && x !== "undefined");

      result.display_name = displayParts.join(", ");
    }
    return result;
  }

  /**
   * Returns the location at the provided coordinates
   * @param coordinates of a place (`lat` and `lon`)
   */
  reverseLookup(coordinates: Coordinates): Observable<GeoResult> {
    const fallback: GeoResult = {
      display_name: $localize`[selected coordinates: ${coordinates.lat} - ${coordinates.lon}]`,
      ...coordinates,
    };

    this.analytics.eventTrack("reverse_lookup_executed", {
      category: "Map",
    });

    return this.http
      .get<OpenStreetMapsSearchResult>(`${this.remoteUrl}/reverse`, {
        params: {
          ...this.defaultOptions,
          lat: coordinates.lat,
          lon: coordinates.lon,
        },
      })
      .pipe(
        map((result) => this.reformatDisplayName(result)),
        catchError(() => of(fallback)),
      );
  }
}

type OpenStreetMapsSearchResult = GeoResult & {
  address: {
    amenity?: string;
    office?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    borough?: string;
    city?: string;
    town?: string;
    postcode?: number;
    country?: string;
    country_code?: string;
  };
};
