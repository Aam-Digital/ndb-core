import { Entity } from "../../entity/model/entity";
import { FilterSelectionOption } from "../../filter/filter-selection/filter-selection";
import { FormFieldConfig } from "../entity-form/entity-form/FormConfig";

export interface EntityListConfig {
  title: string;
  addNew?: string = "Add new";
  filterPlaceholder?: string = "";
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
  type?: "boolean" | "prebuilt" | "configurable-enum";
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
}
