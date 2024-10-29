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

import { Entity } from "../../entity/model/entity";
import { MongoQuery } from "@casl/ability";
import { ListFilterComponent } from "../list-filter/list-filter.component";
import { EventEmitter, Type } from "@angular/core";

/**
 * This filter can be used to filter an array of entities.
 * It has to follow the MongoDB Query Syntax {@link https://www.mongodb.com/docs/manual/reference/operator/query/}.
 *
 * The filter is parsed using ucast {@link https://github.com/stalniy/ucast/tree/master/packages/mongo2js}
 */
export type DataFilter<T> = MongoQuery<T> | {};

export abstract class Filter<T extends Entity> {
  /**
   * The component used to display filter option to the user.
   */
  component: Type<any> = ListFilterComponent;

  public selectedOptionValues: string[] = [];

  /**
   * Triggered when this filter changes value
   * (e.g. when the user selects a new value in a FilterComponent).
   *
   * This is part of the filter object because dynamic filter components can't expose @Outputs
   */
  selectedOptionChange = new EventEmitter<string[]>();

  protected constructor(
    public name: string,
    public label: string = name,
  ) {}

  abstract getFilter(): DataFilter<T>;
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
  public static generateOptions<T extends Entity>(
    valuesToMatchAsOptions: (string | number)[],
    attributeName: string,
  ): FilterSelectionOption<T>[] {
    let keys = new Set();
    return valuesToMatchAsOptions
      .filter((k) => !!k)
      .map((k) => ({
        key: k.toString().toLowerCase(),
        label: k.toString(),
        filter: { [attributeName]: k } as DataFilter<T>,
      }))
      // remove duplicates:
      .filter((value) => !keys.has(value.key) && keys.add(value.key));
  }

  /**
   * Create a FilterSelection with different options to be selected.
   * @param name The name or id describing this filter
   * @param options An array of different filtering variants to chose between
   * @param label The user-friendly label describing this filter-selection
   * (optional, defaults to the name of the selection)
   */
  constructor(
    public override name: string,
    public options: FilterSelectionOption<T>[],
    public override label: string = name,
  ) {
    super(name, label);
    this.selectedOptionValues = [];
  }

  /**
   * Get the full filter option by its key.
   * @param key The identifier of the requested option
   */
  getOption(key: string): FilterSelectionOption<T> | undefined {
    return this.options.find((option: FilterSelectionOption<T>): boolean => {
      return option.key === key;
    });
  }

  /**
   * Get the filter query for the given option.
   * If the given key is undefined or invalid, the returned filter matches any elements.
   */
  public getFilter(): DataFilter<T> {
    const filters: DataFilter<T>[] = this.selectedOptionValues
      .map((value: string) => this.getOption(value))
      .filter((value: FilterSelectionOption<T>) => value !== undefined)
      .map((previousValue: FilterSelectionOption<T>) => {
        return previousValue.filter as DataFilter<T>;
      });

    if (filters.length === 0) {
      return {} as DataFilter<T>;
    }
    return {
      $or: [...filters],
    } as unknown as DataFilter<T>;
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
   */
  filter: DataFilter<T>;
}
