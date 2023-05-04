/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ConfigurableEnumValue } from "app/core/configurable-enum/configurable-enum.interface";
import {
  BooleanFilterConfig,
  DateRangeFilterConfigOption,
} from "app/core/entity-components/entity-list/EntityListConfig";
import { DataFilter } from "../../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "../../entity/model/entity";

export abstract class Filter<T extends Entity> {
  public selectedOption: string;
  constructor(public name: string, public label: string = name) {}
  abstract getFilter(key?: string): DataFilter<T>;
}

export class DateFilter<T extends Entity> extends Filter<T> {
  filter: DataFilter<T>;
  constructor(
    public name: string,
    public label: string = name,
    public standardDateRanges: DateRangeFilterConfigOption[]
  ) {
    super(name, label);
    // if (this.standardDateRanges)
    //   this.selectedOption = this.standardDateRanges[0].label;
  }

  public getFilter(key: string): DataFilter<T> {
    return this.filter;
  }
}

/**
 * Generic configuration for a filter with different selectable {@link FilterSelectionOption} options.
 *
 * This is a reusable format for any kind of dropdown or selection component that offers the user a choice
 * to narrow down a list of data items.
 * As the filter function is provided as part of each {@link FilterSelectionOption}
 * an instance of this FilterSelection class can manage all filter selection logic.
 */
export class SelectableFilter<T extends Entity> extends Filter<T> {
  /**
   * Generate filter options dynamically from the given value to be matched.
   *
   * This is a utility function to make it easier to generate {@link FilterSelectionOption}s for standard cases
   * if you simply want each option to filter items having the given attribute matching different values.
   * If you have more sophisticated filtering needs, use the constructor to set {@link FilterSelectionOption}s that
   * you created yourself.
   *
   * @param valuesToMatchAsOptions An array of values to be matched.
   *        A separate FilterSelectionOption is created for each value with a filter
   *        that is true of a data item's property exactly matches that value.
   * @param attributeName The name of the property of a data item that is compared to the value in the filter function.
   */
  public static generateOptions<TT extends Entity>(
    valuesToMatchAsOptions: string[],
    attributeName: string
  ): FilterSelectionOption<TT>[] {
    const options = [
      {
        key: "",
        label: $localize`:generic filter option showing all entries:All`,
        filter: {} as DataFilter<TT>,
      },
    ];

    valuesToMatchAsOptions.forEach((k) => {
      if (k) {
        options.push({
          key: k.toLowerCase(),
          label: k.toString(),
          filter: { [attributeName]: k } as DataFilter<TT>,
        });
      }
    });

    return options;
  }

  /**
   * Create a FilterSelection with different options to be selected.
   * @param name The name or id describing this filter
   * @param options An array of different filtering variants to chose between
   * @param label The user-friendly label describing this filter-selection
   * (optional, defaults to the name of the selection)
   */
  constructor(
    public name: string,
    public options: FilterSelectionOption<T>[],
    public label: string = name
  ) {
    super(name, label);
    this.selectedOption = this.options[0]?.key;
  }

  /** default filter will keep all items in the result */
  defaultFilter = {};

  /**
   * Get the full filter option by its key.
   * @param key The identifier of the requested option
   */
  getOption(key: string): FilterSelectionOption<T> {
    return this.options.find((option) => option.key === key);
  }

  /**
   * Get the filter query for the given option.
   * If the given key is undefined or invalid, the returned filter matches any elements.
   */
  public getFilter(key: string): DataFilter<T> {
    const option = this.getOption(key);

    if (!option) {
      return this.defaultFilter as DataFilter<T>;
    } else {
      return option.filter;
    }
  }
}

export class BooleanFilter<T extends Entity> extends SelectableFilter<T> {
  constructor(name: string, label: string, config?: BooleanFilterConfig) {
    super(
      name,
      [
        {
          key: "all",
          label: config.all ?? $localize`:Filter label:All`,
          filter: {},
        },
        {
          key: "true",
          label:
            config.true ?? $localize`:Filter label default boolean true:Yes`,
          filter: { [config.id]: true },
        },
        {
          key: "false",
          label:
            config.false ?? $localize`:Filter label default boolean true:No`,
          filter: { [config.id]: false },
        },
      ],
      label
    );
  }
}

export class ConfigurableEnumFilter<
  T extends Entity
> extends SelectableFilter<T> {
  constructor(
    name: string,
    label: string,
    enumValues: ConfigurableEnumValue[]
  ) {
    let options: { key: string; label: string; color?: string; filter: {} }[] =
      [
        {
          key: "all",
          label: $localize`:Filter label:All`,
          filter: {},
        },
      ];
    for (const enumValue of enumValues) {
      options.push({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: { [name + ".id"]: enumValue.id },
      });
    }
    super(name, options, label);
  }
}

export class EntityFilter<T extends Entity> extends SelectableFilter<T> {
  constructor(name: string, label: string, filterEntities) {
    filterEntities.sort((a, b) => a.toString().localeCompare(b.toString()));
    let options: { key: string; label: string; color?: string; filter: {} }[] =
      [
        {
          key: "all",
          label: $localize`:Filter label:All`,
          filter: {},
        },
      ];
    options.push(
      ...filterEntities.map((filterEntity) => ({
        key: filterEntity.getId(),
        label: filterEntity.toString(),
        filter: {
          $or: [
            { [name]: filterEntity.getId() },
            { [name]: { $elemMatch: { $eq: filterEntity.getId() } } },
          ],
        },
      }))
    );
    super(name, options, label);
  }
}

/**
 * Represents one specific option to filter data in a certain way.
 * used by {@link SelectableFilter}
 */
export interface FilterSelectionOption<T> {
  /** identifier for this option in the parent FilterSelection instance */
  key: string;

  /** label displayed for this option to the user in the UI */
  label: string;

  /** Optional color */
  color?: string;

  /**
   * The filter query which should be used if this filter is selected
   *
   * TODO type safety is not yet given -> any should be removed
   */
  filter: DataFilter<T> | any;
}
