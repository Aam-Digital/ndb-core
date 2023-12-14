import { Entity } from "../entity/model/entity";

/**
 * The configuration for a entity details page
 */
export interface EntityDetailsConfig {
  /**
   * The name of the entity (according to the ENTITY_TYPE).
   */
  entity: string;

  /**
   * The configuration for the panels on this details page.
   */
  panels: Panel[];
}

/**
 * A panel is a simple accordion that can be expanded and closed.
 * It can hold multiple components.
 */
export interface Panel {
  /**
   * The title of this panel. This should group the contained components.
   */
  title: string;

  /**
   * The configurations for the components in this panel.
   */
  components: PanelComponent[];
}

/**
 * The configuration for a component displayed inside a panel.
 */
export interface PanelComponent {
  /**
   * An optional second title for only this component.
   */
  title?: string;

  /**
   * The name of the component. When registered, this usually is the name of the
   * component without the `component` suffix
   */
  component: string;

  /**
   * A addition config which will be passed to the component.
   */
  config?: any;
}

/**
 * This interface represents the config which will be created by the entity-details component and passed to each of
 * the panel components.
 *
 * This is not config that is defined and stored in the config file for customization.
 */
export interface PanelConfig<T = any> {
  /**
   * The full entity which is displayed in this details page.
   */
  entity: Entity;

  /**
   * Whether this entity has been newly created.
   */
  creatingNew?: boolean;

  /**
   * An additional config which has been defined in the PanelComponent.
   */
  config?: T;
}
