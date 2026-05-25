import { GeoResult } from "./geo.service";

/**
 * A location both as custom string and an optional geo location lookup.
 */
export interface GeoLocation {
  locationString?: string;
  geoLookup?: GeoResult;
  road?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

export function enrichGeoLocation(
  location: GeoLocation | undefined,
): GeoLocation | undefined {
  if (!location?.geoLookup) {
    return location;
  }

  return {
    ...location,
    road: location.road ?? location.geoLookup.road,
    house_number: location.house_number ?? location.geoLookup.house_number,
    postcode:
      location.postcode ??
      (location.geoLookup.postcode != null
        ? String(location.geoLookup.postcode)
        : undefined),
    city: location.city ?? location.geoLookup.city,
    country: location.country ?? location.geoLookup.country,
  };
}
