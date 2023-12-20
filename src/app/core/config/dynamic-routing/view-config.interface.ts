import { DynamicComponentConfig } from "../dynamic-components/dynamic-component-config.interface";

/**
 * Object specifying a route and config of its view
 * as stored in the config database
 */
export interface ViewConfig<T = any> extends DynamicComponentConfig<T> {
  /** config object id which equals the route path */
  _id: string;

  /**
   * indicate that the route is lazy loaded.
   *
   * At the moment that means the routing is set in the app.routing.ts and not loaded from the config.
   * The ViewConfig of a lazy-loaded route is only used for additional flags like `requiresAdmin`.
   */
  lazyLoaded?: boolean;
}

/**
 * The prefix which is used to find the ViewConfig's in the config file
 */
export const PREFIX_VIEW_CONFIG = "view:";
