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
import {
  enrichGeoLocation,
  GeoLocation,
  getCityFromAddress,
} from "./geo-location";

export interface GeoResult extends Coordinates {
  display_name: string;
  /** Unique id of the place, used to tell apart results sharing a display name */
  place_id?: number;
}

/**
 * Country whose addresses are written as "Street 12, 12345 City",
 * the format {@link GeoService.reformatDisplayName} produces.
 */
const GERMAN_ADDRESS_FORMAT_COUNTRY = "de";

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

  /**
   * Optional country filter for lookups, only applied if an instance configures one.
   * Nominatim treats this as a hard filter, so anything outside these countries
   * is dropped from the results entirely.
   */
  private countrycodes?: string;
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
      if (config?.countrycodes === this.countrycodes) {
        return;
      }

      this.countrycodes = config?.countrycodes;
      // cached results are keyed by search term alone, so they belong to the
      // previous filter and its address format
      this.cache.clear();
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
          ...(this.countrycodes ? { countrycodes: this.countrycodes } : {}),
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
  private formatStreet(addr: OpenStreetMapsSearchResult["address"]): string {
    if (!addr.road || !addr.house_number) {
      return addr.road || addr.house_number || "";
    }
    return this.useGermanAddressFormat
      ? `${addr.road} ${addr.house_number}`
      : `${addr.house_number} ${addr.road}`;
  }

  private formatCityAndPostcode(
    addr: OpenStreetMapsSearchResult["address"],
  ): string {
    const city = getCityFromAddress(addr);
    if (!city || !addr.postcode) {
      return city || addr.postcode || "";
    }
    return this.useGermanAddressFormat
      ? `${addr.postcode} ${city}`
      : `${city} ${addr.postcode}`;
  }

  /**
   * Whether the German address format applies, i.e. "Street 12, 12345 City"
   * without the country. Only instances restricting lookups to Germany use it;
   * everywhere else the default format applies.
   */
  private get useGermanAddressFormat(): boolean {
    return (
      this.countrycodes?.trim().toLowerCase() === GERMAN_ADDRESS_FORMAT_COUNTRY
    );
  }

  /**
   * The address text in whichever format applies:
   * German instances get "Street 12, 12345 City", everyone else
   * "12 Street, City 12345, Country".
   */
  private formatAddress(addr: OpenStreetMapsSearchResult["address"]): string {
    const parts = this.useGermanAddressFormat
      ? [
          addr.amenity ?? addr.office,
          this.formatStreet(addr),
          this.formatCityAndPostcode(addr),
        ]
      : [
          this.formatStreet(addr),
          this.formatCityAndPostcode(addr),
          addr.country,
        ];

    return parts.filter((x) => !!x && x !== "undefined").join(", ");
  }

  reformatDisplayName(
    result: OpenStreetMapsSearchResult,
  ): OpenStreetMapsSearchResult {
    const addr = result?.address;
    if (!addr) {
      return result;
    }

    // Ensure a normalized `city` field for downstream consumers, since
    // OpenStreetMap often names the place something other than `city`
    const city = getCityFromAddress(addr);
    if (city && !addr.city) {
      addr.city = city;
    }

    // Keep OpenStreetMap's own name for results holding none of our parts,
    // so an entry can never end up without a label
    result.display_name = this.formatAddress(addr) || result.display_name;
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
   * Deliberately mirrors the format of {@link reformatDisplayName}: callers
   * compare the composed string against a lookup's `display_name` to tell
   * whether the address text was customized, so the two must be able to match.
   */
  composeAddressFromParts(location: GeoLocation | undefined): string {
    if (!location) {
      return "";
    }
    return this.formatAddress(location);
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
    municipality?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
};
