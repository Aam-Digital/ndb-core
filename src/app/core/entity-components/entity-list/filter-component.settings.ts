import { Filter } from "../../filter/filter-selection/filter-selection";
import { Entity } from "../../entity/model/entity";
import { FilterConfig } from "./EntityListConfig";

/**
 * A simple interface which holds all required information to display and use a filter.
 */
export interface FilterComponentSettings<T extends Entity> {
  /**
   * The filter selection which handles the logic for filtering the data.
   */
  filterSettings: Filter<T>;

  /**
   * The selected option of this filter.
   */
  selectedOption?: string;

  /**
   * The way in which the filter should be displayed.
   * Possible values: "dropdown" which will render it as a dropdown selection.
   * Default to buttons next to each other.
   */
  display?: string;

  /**
   * The label for this filter.
   */
  label?: string;

  filterConfig: FilterConfig;
}
