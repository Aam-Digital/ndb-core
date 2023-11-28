import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

/**
 * A group of related form fields displayed within a Form component.
 */
export interface FieldGroup {
  header?: string;
  fields: ColumnConfig[];
}
