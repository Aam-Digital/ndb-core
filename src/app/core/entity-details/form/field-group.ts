import { ColumnConfig } from "../../common-components/entity-form/FormConfig";

/**
 * A group of related form fields displayed within a Form component.
 */
export interface FieldGroup {
  header?: string;
  fields: ColumnConfig[];
}
