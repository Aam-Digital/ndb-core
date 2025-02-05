import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";

/**
 * Additional properties defined in the "interaction-type" {@link ConfigurableEnumValue} values
 * providing special context for {@link Note} categories.
 */
export interface InteractionType extends ConfigurableEnumValue {
  /** whether the Note is a group type category that stores attendance details for each related person */
  isMeeting?: boolean;
}

/**
 * ID of the Note category {@link ConfigurableEnumValue} in the config database.
 */
export const INTERACTION_TYPE_CONFIG_ID = "interaction-type";
