import { OpenStreetMapsSearchResult } from "./geo.service";

/**
 * Fields OpenStreetMap may use for the place a person would name as their
 * town, ordered from the most specific to the widest area.
 * Many places have no `city` at all: an address in a Dublin suburb, for
 * example, only carries `suburb`.
 */
const CITY_FIELDS = [
  "city",
  "town",
  "village",
  "suburb",
  "municipality",
] as const;

type AddressWithCityFields = Partial<
  Record<(typeof CITY_FIELDS)[number], string>
>;

/**
 * The most specific place name available for an address.
 */
export function getCityFromAddress(
  address: AddressWithCityFields | undefined,
): string | undefined {
  return CITY_FIELDS.map((field) => address?.[field]).find((value) => !!value);
}

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

  const formatPostcode = () =>
    addr.postcode != null ? String(addr.postcode) : undefined;

  return {
    ...location,
    road: location.road ?? addr.road,
    house_number: location.house_number ?? addr.house_number,
    postcode: location.postcode ?? formatPostcode(),
    city: location.city ?? getCityFromAddress(addr),
    country: location.country ?? addr.country,
  };
}
