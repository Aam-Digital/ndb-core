import { Entity } from "../../entity/model/entity";
import { DataFilter, Filter } from "./filters";
import { NumberRangeFilterComponent } from "app/core/basic-datatypes/number/number-range-filter/number-range-filter.component";

/**
 * Represents a filter for number values.
 */
export class NumberFilter<T extends Entity> extends Filter<T> {
  override component = NumberRangeFilterComponent;

  constructor(
    public override name: string,
    public override label: string = name,
  ) {
    super(name, label);
    this.selectedOptionValues = [];
  }

  getFilter(): DataFilter<T> {
    console.log("Peter this.selectedOptionValues", this.selectedOptionValues);

    const filterObject: { $gte?; $lte?: number } = {};
    if (this.selectedOptionValues[0]) {
      filterObject.$gte = Number(this.selectedOptionValues[0]);
    }
    if (this.selectedOptionValues[1]) {
      filterObject.$lte = Number(this.selectedOptionValues[1]);
    }
    if (filterObject.$gte || filterObject.$lte) {
      console.log("Peter data filter", {
        [this.name]: filterObject,
      } as DataFilter<T>);
      return {
        [this.name]: filterObject,
      } as DataFilter<T>;
    }
    return {} as DataFilter<T>;
  }
}
