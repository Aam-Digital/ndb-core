/**
 * Base for any component used as a dynamically injected component
 * to allow inputs being initialized from a config object.
 */
export interface OnInitDynamicComponent {
  /**
   * Initialize any inputs of the component from a config object.
   * @param config The config object as retrieved from the config database
   */
  onInitFromDynamicConfig(config: any);
}
