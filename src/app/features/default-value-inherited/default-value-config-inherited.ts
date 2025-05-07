/**
 * DefaultValueConfig configuration for "inherited-from-referenced-entity" mode.
 */
export interface DefaultValueConfigInherited {
  /**
   * local field holding the reference to an Entity (for inherited only)
   */
  localAttribute?: string;

  /**
   * field on the referenced Entity (identified by the id value in `localAttribute`),
   * which is used as default value (for inherited only)
   */
  field?: string;
}
