import { Entity } from "../../entity/entity";
import { FilterSelectionOption } from "../../filter/filter-selection/filter-selection";

export class EntityListConfig {
  title: string;
  columns: ColumnConfig[];
  columnGroup: ColumnGroupConfig;
  filters: FilterConfig[];
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
  default: string;
  mobile: string;
  groups: GroupConfig[];
}

export class GroupConfig {
  name: string;
  columns: string[];
}

export class FilterConfig {
  id: string;
  display?: string;
  type?: string;
  default?: string;
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
