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
  mode: "inherited" | "static" | "dynamic";

  /** used as default value in "static" and "dynamic" mode */
  value?: string | number;

  /** local field holding the reference to an Entity (for inherited only) */
  localAttribute?: string;

  /** field on the referenced Entity (identified by the id value in `localAttribute`), which is used as default value (for inherited only) */
  field?: string;
}
