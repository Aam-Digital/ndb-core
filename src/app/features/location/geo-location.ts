import { GeoResult } from "./geo.service";

/**
 * A location both as custom string and an optional geo location lookup.
 */
export interface GeoLocation {
  locationString?: string;
  geoLookup?: GeoResult;
}
