import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

/**
 * The (possibly abbreviated) configuration for a "FormComponent", as it is stored in the config file.
 */
export interface FormConfig {
  fieldGroups: FieldGroup[];
}

/**
 * A group of related form fields displayed within a Form component.
 */
export interface FieldGroup {
  header?: string;
  fields: ColumnConfig[];
}
