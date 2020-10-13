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
  component?: string;

  /**
   * In case of lazy loading:
   * strings of the module path and name.
   * The component id has to be registered in the component map.
   */
  importModulePath?: string;
  importModuleName?: string;

  /** whether users need admin rights to access this view */
  requiresAdmin?: boolean;

  /** optional object providing any kind of config to be interpreted by the component for this view */
  config?: any;
}
