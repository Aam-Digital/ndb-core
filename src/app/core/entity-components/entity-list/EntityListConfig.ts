import { Entity } from "../../entity/entity";
import { FilterSelectionOption } from "../../filter/filter-selection/filter-selection";

export class EntityListConfig {
  title: string;
  columns: ColumnConfig[];
  addNew?: string = "Add new";
  filterPlaceholder?: string = "";

  /**
   * Optional config for which columns are displayed.
   * By default all columns are shown
   */
  columnGroup?: ColumnGroupConfig;

  /**
   * Optional config for available filters.
   * Default is no filters.
   */
  filters?: FilterConfig[];
}

export class ColumnConfig {
  component: string;
  title: string;
  id: string;
  /** this config can be anything that the component understands to parse */
  config?: any;
  noSorting?: boolean = false;
}

export class ColumnGroupConfig {
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

export class GroupConfig {
  name: string;
  columns: string[];
}

export class FilterConfig {
  id: string;
  display?: string;
  type?: "boolean" | "prebuilt" | "configurable-enum";
  default?: string;
  label?: string;
}

export class BooleanFilterConfig extends FilterConfig {
  true: string;
  false: string;
  all: string;
}

export class PrebuiltFilterConfig<T> extends FilterConfig {
  options: FilterSelectionOption<T>[];
}

export class ConfigurableEnumFilterConfig<T> extends FilterConfig {
  enumId: string;
}

export class ColumnCellConfig {
  entity: Entity;
  id: string;
  config?: any;
}
