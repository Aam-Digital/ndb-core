import { Entity } from "../../entity/model/entity";
import { FilterSelectionOption } from "../../filter/filter-selection/filter-selection";
import { FormFieldConfig } from "../entity-form/entity-form/FormConfig";
import { ExportColumnConfig } from "../../export/export-service/export-column-config";

export interface EntityListConfig {
  /**
   * Title that is shown on top of the component
   */
  title: string;

  /**
   * Select which entities should be displayed in the table
   * (optional) This is only used and necessary if EntityListComponent is used directly in config
   */
  entity?: string;

  /**
   * Placeholder string in the filter input
   */
  filterPlaceholder?: string;

  /**
   * The columns to be displayed in the table
   */
  columns: (FormFieldConfig | string)[];

  /**
   * Optional config for which columns are displayed.
   * By default all columns are shown
   */
  columnGroups?: ColumnGroupsConfig;

  /**
   * Optional config for available filters.
   * Default is no filters.
   */
  filters?: FilterConfig[];

  /**
   * Optional config defining what fields are included in exports.
   */
  exportConfig?: ExportColumnConfig[];
}

export interface ColumnGroupsConfig {
  groups: GroupConfig[];

  /**
   * The name of the group that should be selected by default.
   * Default is the name of the first group.
   */
  default?: string;

  /**
   * The name of the group group that should be selected by default on a mobile device.
   * Default is the name of the first group.
   */
  mobile?: string;
}

export interface GroupConfig {
  name: string;
  columns: string[];
}

export interface FilterConfig {
  id: string;
  display?: string;
  type?: string;
  default?: string;
  label?: string;
}

export interface BooleanFilterConfig extends FilterConfig {
  true: string;
  false: string;
  all: string;
}

export interface DateRangeFilterConfig extends FilterConfig {
  startingDayOfWeek?: // manually setting with what day a calendar week should start
  | "Sunday"
    | "sunday"
    | "Monday"
    | "monday"
    | "Tuesday"
    | "tuesday"
    | "Wednesday"
    | "wednesday"
    | "Thursday"
    | "thursday"
    | "Friday"
    | "friday"
    | "Saturday"
    | "saturday";
  weeksBack: number[]; // starting with 1 for "this week"
}

export interface PrebuiltFilterConfig<T> extends FilterConfig {
  options: FilterSelectionOption<T>[];
}

export interface ConfigurableEnumFilterConfig<T> extends FilterConfig {
  enumId: string;
}

export interface ViewPropertyConfig {
  /**
   * The entity which is being displayed, this should only be used if `value` does not contain enough information
   */
  entity: Entity;
  /**
   * The name of the property of the entity which should be displayed
   */
  id: string;
  /**
   * This represents `entity[id]` and makes the component re-build whenever this value changes.
   */
  value: any;
  /**
   * Further configuration that will be passed to the final component
   */
  config?: any;
  /**
   * A tooltip that describes this property in more detail
   */
  tooltip?: string;
}
