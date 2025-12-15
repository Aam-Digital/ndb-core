/**
 * Describes the default value behaviour of this field,
 * i.e. that this field should automatically be filled with a value when creating a new entity
 */
export interface DefaultValueConfig {
  /**
   * What kind of logic is used to generate the default value:
   *
   *  mode: inherited
   *  use the value from linked entity field
   *
   *  mode: static
   *  use a static default value
   *
   *  mode: dynamic
   *  use a placeholder value, see PLACEHOLDERS enum for available options
   */
  mode: DefaultValueMode;

  /**
   * The configuration for the given defaultValue mode.
   * See implementation of each mode for details.
   */
  config?: any;
}

export type DefaultValueMode = "static" | "dynamic" | "inherited-field";
