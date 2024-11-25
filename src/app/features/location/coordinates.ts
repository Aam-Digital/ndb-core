export interface Coordinates {
  lat: number;
  lon: number;

  /** optional accuracy (e.g. from GPS location sensor) */
  accuracy?: number;
}
