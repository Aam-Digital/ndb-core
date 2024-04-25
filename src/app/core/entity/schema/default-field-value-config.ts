/**
 * Describes the default value behaviour of this field
 */
export interface DefaultFieldValueConfig {
  mode: "inheritance" | "static" | "dynamic";
  
  /** used as default value in "static" and "dynamic" mode */
  value?: string;
  
  /** local field holding the reference to an Entity (for inheritance only) */
  localAttribute?: string;
  /** field on the referenced Entity (identified by the id value in `localAttribute`), which is used as default value (for inheritance only) */
  field?: string;
}
