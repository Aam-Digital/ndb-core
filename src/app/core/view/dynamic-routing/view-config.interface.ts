/**
 * Object specifying a route and config of its view
 * as stored in the config database
 */
export interface ViewConfig {
  /** config object id which equals the route path */
  _id: string;

  /**
   * string id/name of the component to be displaying this view.
   * The component id has to be registered in the component map.
   */
  component: string;

  /** whether users need admin rights to access this view
   * @deprecated use permittedUserRoles instead
   * */
  requiresAdmin?: boolean;

  /**
   * Allows to restrict the route to the given list of user roles.
   * If set, the route can only be visited by users which have a role which is in the list.
   * If not set, all logged in users can viste the route.
   */
  permittedUserRoles?: string[];

  /** optional object providing any kind of config to be interpreted by the component for this view */
  config?: any;

  /**
   * indicate that the route is lazy loaded.
   *
   * At the moment that means the routing is set in the app.routing.ts and not loaded from the config.
   * The ViewConfig of a lazy-loaded route is only used for additional flags like `requiresAdmin`.
   */
  lazyLoaded?: boolean;
}
