import { FilterSelectionOption } from "../filter/filters/filters";
import { FormFieldConfig } from "../common-components/entity-form/entity-form/FormConfig";
import { ExportColumnConfig } from "../export/data-transformation-service/export-column-config";
import { Sort } from "@angular/material/sort";
import { unitOfTime } from "moment";

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
   * Optional initial sort order.
   * Default is to sort by the first column.
   */
  defaultSort?: Sort;

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

export type FilterConfig<T = any> =
  | BasicFilterConfig
  | BooleanFilterConfig
  | PrebuiltFilterConfig<T>
  | ConfigurableEnumFilterConfig<T>;

export interface BasicFilterConfig {
  id: string;
  type?: string;
  default?: string;
  label?: string;
}

export interface BooleanFilterConfig extends BasicFilterConfig {
  true: string;
  false: string;
  all: string;
}

export interface PrebuiltFilterConfig<T> extends BasicFilterConfig {
  options: FilterSelectionOption<T>[];
}
export interface DateRangeFilterConfig extends BasicFilterConfig {
  options: DateRangeFilterConfigOption[];
}

export interface DateRangeFilterConfigOption {
  startOffsets?: { amount: number; unit: unitOfTime.Base }[];
  endOffsets?: { amount: number; unit: unitOfTime.Base }[];
  label: string;
}

export interface PrebuiltFilterConfig<T> extends BasicFilterConfig {
  options: FilterSelectionOption<T>[];
}

export interface ConfigurableEnumFilterConfig<T> extends BasicFilterConfig {
  enumId: string;
}
