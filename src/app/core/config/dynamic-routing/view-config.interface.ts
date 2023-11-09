/**
 * Object specifying a route and config of its view
 * as stored in the config database
 */
export interface ViewConfig<T = any> {
  /** config object id which equals the route path */
  _id: string;

  /**
   * string id/name of the component to be displaying this view.
   * The component id has to be registered in the component map.
   *
   * (optional) if the `ladyLoaded` is true, this is not required (and will be ignored)
   *    This allows hard-coded lazy-loaded components to be dynamically extended with config or permissions.
   */
  component?: string;

  /**
   * Allows to restrict the route to the given list of user roles.
   * If set, the route can only be visited by users which have a role which is in the list.
   * If not set, all logged-in users can visit the route.
   */
  permittedUserRoles?: string[];

  /** optional object providing any kind of config to be interpreted by the component for this view */
  config?: T;

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

/**
 * This interface is set on the `data` property of the route.
 * It contains static data which are used to build components and manage permissions.
 * The generic type defines the interface for the component specific configuration.
 *
 * The properties given in the `config` object here are automatically assigned to the component as `@Input()` properties.
 * e.g. for an RouteData `{ config: { "entityType: "Child", "filtered": true } }`
 * your component `MyViewComponent` will receive the values mapped to its properties:
 * ```javascript
 * class MyViewComponent {
 *   @Input() entityType: string;
 *   @Input() filtered: boolean;
 * }
 * ```
 */
export interface RouteData<T = any> {
  /**
   * If the `UserRoleGuard` is used for the route, this array holds the information which roles can access the route.
   */
  permittedUserRoles?: string[];

  /**
   * The component specific configuration.
   */
  config?: T;
}
