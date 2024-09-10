import { EntitySchemaField } from "./schema/entity-schema-field";
import { EntityBlockConfig } from "../basic-datatypes/entity/entity-block/entity-block-config";

/**
 * Dynamic configuration for a entity.
 * This allows to change entity metadata based on the configuration.
 */
export interface EntityConfig {
  /**
   * A list of attributes that will be dynamically added/overwritten to the entity.
   */
  attributes?: { [key: string]: EntitySchemaField };

  /**
   * A list of attributes which should be shown when calling the `.toString()` method of this entity.
   * E.g. showing the first and last name of a child.
   *
   * (optional) the default is the ID of the entity (`.entityId`)
   */
  toStringAttributes?: string[];

  /**
   * Details to be displayed of this entity as a tooltip.
   */
  toBlockDetailsAttributes?: EntityBlockConfig;

  /**
   * human-readable name/label of the entity in the UI
   */
  label?: string;

  /**
   * human-readable name/label of the entity in the UI when referring to multiple
   */
  labelPlural?: string;

  /**
   * icon used to visualize the entity type
   */
  icon?: string;

  /**
   * color used for to highlight this entity type across the app
   */
  color?: string;

  /**
   * base route of views for this entity type
   */
  route?: string;

  /**
   * when a new entity is created, all properties from this class will also be available
   */
  extends?: string;

  /**
   * whether the type can contain personally identifiable information (PII)
   */
  hasPII?: boolean;
}
