export const MAP_CONFIG_KEY = "appConfig:map";

/**
 * General configuration for the map integration
 */
export interface MapConfig {
  /**
   * Countries, from which search results will be included
   * see {@link https://nominatim.org/release-docs/develop/api/Search/#result-limitation}
   */
  countrycodes?: string;
  /**
   * Start location of map if nothing was selected yet
   */
  start?: [number, number];
}

export const LOCATION_PERMISSION_STATUS_GRANTED = "granted";

export const LOCATION_PERMISSION_STATUS_PROMPT = "prompt";
