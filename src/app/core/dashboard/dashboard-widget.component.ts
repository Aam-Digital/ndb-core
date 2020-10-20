/**
 * Base for any component used as a dashboard widget.
 */
export interface DashboardWidgetComponent {
  /**
   * Initialize any inputs of the component from a config object.
   * @param config The config object as retrieved from the config database
   */
  initFromConfig(config: any);
}
