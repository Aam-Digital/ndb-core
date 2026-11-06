import { DataSourceConfig } from "#src/app/core/common-components/entities-table/data-source/data-source-registry";
import { FilterSelectionOption } from "../filter/filters/filters";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";
import { Sort } from "@angular/material/sort";
import { unitOfTime } from "moment";
import { TranslatableText } from "../config/multi-lingual-config";

export interface EntityListConfig {
  /**
   * Title that is shown on top of the component
   */
  title?: string;

  /**
   * Select which entities should be displayed in the table
   * (optional) This is only used and necessary if EntityListComponent is used directly in config
   */
  entityType?: string;

  /**
   * Select what kind of data source is used for the table:
   * the name of a data source in the `DataSourceRegistry`
   * ("in-memory", "paginated" or one registered by a feature module),
   * or such a name with options for the data source: `{ "name": "...", "config": { ... } }`.
   * (optional) default is "paginated" in online-only session and "in-memory" otherwise,
   * see `resolveDataSource` in `data-source-resolver.ts`
   */
  dataSource?: string | DataSourceConfig;

  /**
   * Custom overwrites or additional columns to be displayed in the table.
   *
   * If any special columns aside from the entity's fields are needed, add them here.
   * Fields of the entity type are available automatically.
   */
  columns?: (FormFieldConfig | string)[];

  /**
   * Optional config for which columns are displayed.
   * By default, all columns are shown
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
}

export interface ColumnGroupsConfig {
  /**
   * The groups of columns the user can switch between (shown as tabs).
   *
   * The first group is selected initially.
   * On a small screen (mobile), the group with the fewest columns is selected initially instead
   * (the first of them if several have the same number of columns).
   */
  groups: GroupConfig[];
}

export interface GroupConfig {
  name: TranslatableText;
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
  singleSelectOnly?: boolean;
}

export interface BooleanFilterConfig extends BasicFilterConfig {
  true: string;
  false: string;
}

export interface PrebuiltFilterConfig<T> extends BasicFilterConfig {
  options: FilterSelectionOption<T>[];
}

export interface DateRangeFilterConfig extends BasicFilterConfig {
  options: DateRangeFilterConfigOption[];
}

export interface DateRangeFilterConfigOption {
  startOffsets?: {
    amount: number;
    unit: unitOfTime.Base | unitOfTime._quarter;
  }[];
  endOffsets?: {
    amount: number;
    unit: unitOfTime.Base | unitOfTime._quarter;
  }[];
  label: string;
}

export interface ConfigurableEnumFilterConfig<T> extends BasicFilterConfig {
  enumId: string;
}
