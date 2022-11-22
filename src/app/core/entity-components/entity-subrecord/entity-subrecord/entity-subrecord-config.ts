import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";

/**
 * Configuration that is commonly used when working with the entity subrecord
 */
export interface EntitySubrecordConfig {
  columns?: ColumnConfig[];
}

/**
 * Type for the definition of a single column in the EntitySubrecord
 */
export type ColumnConfig = string | FormFieldConfig;
