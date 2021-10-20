/**
 * Interface for the config object in the general application configuration database
 * to define usage analytics settings.
 */
export interface UsageAnalyticsConfig {
  /** url of the backend to report usage data to */
  url: string;

  /** the id by which this site is represented in the analytics backend */
  site_id: string;

  /** do not set any cookies for analytics */
  no_cookies?: boolean;
}

export const USAGE_ANALYTICS_CONFIG_ID = "appConfig:usage-analytics";
