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

export interface PrebuiltFilterConfig<T> extends FilterConfig {
  options: FilterSelectionOption<T>[];
}

export interface ConfigurableEnumFilterConfig<T> extends FilterConfig {
  enumId: string;
}

export interface ViewPropertyConfig {
  entity: Entity;
  id: string;
  config?: any;
  tooltip?: string;
}
