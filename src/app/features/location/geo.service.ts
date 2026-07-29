import { Injectable, inject } from "@angular/core";
import {
  Observable,
  ReplaySubject,
  Subject,
  concat,
  defer,
  of,
  timer,
} from "rxjs";
import { Coordinates } from "./coordinates";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "../../core/config/config.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { environment } from "../../../environments/environment";
import { MAP_CONFIG_KEY, MapConfig } from "./map-config";
import {
  catchError,
  concatMap,
  ignoreElements,
  map,
  tap,
} from "rxjs/operators";
import { enrichGeoLocation, GeoLocation } from "./geo-location";

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
  private http = inject(HttpClient);
  private analytics = inject(AnalyticsService);

  private readonly remoteUrl = "/nominatim";
  private countrycodes = "de";
  private defaultOptions = {
    format: "json",
    addressdetails: 1,
    // Only include the email param when configured — sending `email=undefined`
    // (the literal string) violates Nominatim usage policy.
    ...(environment.webmaster_email
      ? { email: environment.webmaster_email }
      : {}),
  };

  private readonly cache = new Map<string, OpenStreetMapsSearchResult[]>();
  private readonly lookupQueue$ = new Subject<{
    term: string;
    resolve: ReplaySubject<OpenStreetMapsSearchResult[]>;
  }>();

  constructor() {
    const configService = inject(ConfigService);

    configService.configUpdates.subscribe(() => {
      const config = configService.getConfig<MapConfig>(MAP_CONFIG_KEY);
      if (config?.countrycodes) {
        this.countrycodes = config.countrycodes;
      }
    });

    // Process lookups sequentially with a 1s cooldown after every attempt
    // (Nominatim usage policy: max 1 request/sec regardless of success or failure)
    this.lookupQueue$
      .pipe(
        concatMap(({ term, resolve }) =>
          concat(
            this.fetchLookup(term).pipe(
              tap((results) => {
                this.cache.set(term, results);
                resolve.next(results);
                resolve.complete();
              }),
              catchError((err) => {
                resolve.error(err);
                return of([] as GeoResult[]);
              }),
            ),
            defer(() => timer(1000).pipe(ignoreElements())),
          ),
        ),
      )
      .subscribe();
  }

  /**
   * Returns locations that match the search term.
   * Results are cached and requests are throttled to ≤1/sec per Nominatim policy.
   * @param searchTerm e.g. `Rollbergstraße Berlin`
   */
  lookup(searchTerm: string): Observable<OpenStreetMapsSearchResult[]> {
    if (this.cache.has(searchTerm)) {
      return of(this.cache.get(searchTerm));
    }
    const resolve = new ReplaySubject<OpenStreetMapsSearchResult[]>(1);
    this.lookupQueue$.next({ term: searchTerm, resolve });
    return resolve.asObservable();
  }

  private fetchLookup(
    searchTerm: string,
  ): Observable<OpenStreetMapsSearchResult[]> {
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
  private getCity(addr: OpenStreetMapsSearchResult["address"]): string {
    return addr.city ?? addr.village ?? addr.town ?? "";
  }

  private formatStreet(addr: OpenStreetMapsSearchResult["address"]): string {
    if (!addr.road && !addr.house_number) return "";
    if (addr.road && addr.house_number)
      return `${addr.road} ${addr.house_number}`;
    return addr.road || addr.house_number || "";
  }

  private formatPostcodeCity(
    addr: OpenStreetMapsSearchResult["address"],
  ): string {
    const city = this.getCity(addr);
    if (addr.postcode && city) return `${addr.postcode} ${city}`;
    if (addr.postcode) return `${addr.postcode}`;
    if (city) return city;
    return "";
  }

  reformatDisplayName(
    result: OpenStreetMapsSearchResult,
  ): OpenStreetMapsSearchResult {
    const addr = result?.address;
    if (addr) {
      const displayParts = [
        addr.amenity ?? addr.office,
        this.formatStreet(addr),
        this.formatPostcodeCity(addr),
      ].filter((x) => !!x && x !== "undefined");

      // Ensure a normalized `city` field for downstream consumers (use village/town as fallback)
      const city = this.getCity(addr);
      if (city && !addr.city) {
        addr.city = city;
      }

      result.display_name = displayParts.join(", ");
    }
    return result;
  }

  /**
   * Returns the location at the provided coordinates
   * @param coordinates of a place (`lat` and `lon`)
   */
  reverseLookup(
    coordinates: Coordinates,
  ): Observable<OpenStreetMapsSearchResult> {
    const fallback: OpenStreetMapsSearchResult = {
      display_name: $localize`[selected coordinates: ${coordinates.lat} - ${coordinates.lon}]`,
      ...coordinates,
      address: undefined,
    } as OpenStreetMapsSearchResult;

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

  /**
   * Enriches a GeoLocation with top-level address parts derived from its `geoLookup`.
   * Provided on the service so callers do not need to import the helper.
   */
  enrichGeoLocation(
    location: GeoLocation | undefined,
  ): GeoLocation | undefined {
    return enrichGeoLocation(location);
  }

  /**
   * Composes a display address string from a GeoLocation's structured parts
   * (the reverse of what {@link enrichGeoLocation} derives from a lookup).
   *
   * Deliberately mirrors the format of {@link reformatDisplayName} (street,
   * then postcode + city) and omits `country`: callers compare the composed
   * string against a lookup's `display_name` to tell whether the address text
   * was customized, so the two must be able to match.
   */
  composeAddressFromParts(location: GeoLocation | undefined): string {
    if (!location) {
      return "";
    }
    return [this.formatStreet(location), this.formatPostcodeCity(location)]
      .filter((x) => !!x)
      .join(", ");
  }
}

export type OpenStreetMapsSearchResult = GeoResult & {
  address?: {
    amenity?: string;
    office?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    borough?: string;
    city?: string;
    village?: string;
    town?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
};
