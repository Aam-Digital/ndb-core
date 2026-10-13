/**
 * This interface is set on the `data` property of the route.
 * It contains static data which are used to build components and manage permissions.
 * The generic type defines the interface for the component specific configuration.
 *
 * The properties given in the `config` object here are automatically assigned to the component as `@Input()` properties.
 * e.g. for an DynamicComponentConfig `{ config: { "entityType: "Child", "filtered": true } }`
 * your component `MyViewComponent` will receive the values mapped to its properties:
 * ```javascript
 * class MyViewComponent {
 *   @Input() entityType: string;
 *   @Input() filtered: boolean;
 * }
 * ```
 */
export interface DynamicComponentConfig<T = any> {
  /**
   * string id/name of the component to be displaying this view.
   * The component id has to be registered in the component map.
   *
   * (optional) if the `ladyLoaded` is true, this is not required (and will be ignored)
   *    This allows hard-coded lazy-loaded components to be dynamically extended with config or permissions.
   */
  component?: string;

  /** optional object providing any kind of config to be interpreted by the component for this view */
  config?: T;

  /**
   * Restricts the route to users with **at least one** of these roles ("any of").
   * If not set, all logged-in users can visit the route.
   */
  permittedUserRoles?: string[];

  /**
   * Restricts the route to users with **every one** of these roles ("all of"), e.g. `["admin_app", "account_manager"]`
   * for a page that requires both.
   * If set together with `permittedUserRoles`, a user has to fulfil both.
   */
  allRequiredUserRoles?: string[];
}
