/**
 * Describes the default value behaviour of this field
 *
 * @field value This value is used as default value in "static" and "dynamic" mode
 * @field localAttribute Is the local field holding the reference to an Entity
 * @field field The field on the referenced Entity wich is used as default value
 */
export interface DefaultFieldValueConfig {
  mode: "inheritance" | "static" | "dynamic";
  value?: string;
  localAttribute?: string;
  field?: string;
}
