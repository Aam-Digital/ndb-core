import { OpenStreetMapsSearchResult } from "./geo.service";

/**
 * A location both as custom string and an optional geo location lookup.
 */
export interface GeoLocation {
  locationString?: string;
  geoLookup?: OpenStreetMapsSearchResult;
  road?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

export function enrichGeoLocation(
  location: GeoLocation | undefined,
): GeoLocation | undefined {
  if (!location?.geoLookup) return location;

  const addr = location.geoLookup.address;
  if (!addr) return location;

  const getCity = () => addr.city ?? addr.village ?? addr.town ?? undefined;
  const formatPostcode = () =>
    addr.postcode != null ? String(addr.postcode) : undefined;

  return {
    ...location,
    road: location.road ?? addr.road,
    house_number: location.house_number ?? addr.house_number,
    postcode: location.postcode ?? formatPostcode(),
    city: location.city ?? getCity(),
    country: location.country ?? addr.country,
  };
}
