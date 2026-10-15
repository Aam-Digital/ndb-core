import { DataFilter } from "#src/app/core/filter/filters/filters";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";

/**
 * A group of related form fields displayed within a Form component.
 */
export interface FieldGroup {
  header?: string;
  fields: ColumnConfig[];

  /**
   * (Optional) A Mango/MongoDB style query condition that determines whether the whole group is displayed.
   * Works like `EntitySchemaField.displayCondition`, applied to every field of this group
   * (in addition to the field's own condition).
   */
  displayCondition?: DataFilter<any>;
}
