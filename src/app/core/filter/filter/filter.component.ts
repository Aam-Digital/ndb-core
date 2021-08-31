import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Simple (dumb) component to infer and display filter options for a dataset.
 *
 * e.g. showing all distinct values of a certain property across the given data in a dropdown
 * and providing a filter function based on the selection as output.
 */
@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
})
export class FilterComponent<T> {
  /** special filter option value/key for displaying all data without applying a filter */
  readonly FILTER_VALUE_ALL = "";

  /** data from which to infer available filter values */
  @Input() set data(values: T[]) {
    this._data = values;
    this.updateFilterOptions();
  }
  private _data: T[];

  /** property name on data objects for which this filter is built */
  @Input() set filterProperty(value: string) {
    this._filterProperty = value;
    if (!this.label) {
      this.label = value;
    }
    this.updateFilterOptions();
  }
  private _filterProperty: string;

  /** label describing this filter as a whole */
  @Input() label: string;

  filterOptions: { id: string; label: string }[] = [];

  /** whether to display this filter as a toggle set rather than dropdown */
  @Input() displayAsToggle: boolean = false;

  @Input() selectedOption: string;
  @Output() selectedOptionChange = new EventEmitter<string>();
  @Output() selectedFilterFunction = new EventEmitter<(T) => boolean>();

  constructor() {}

  private updateFilterOptions() {
    const propertyId = this._filterProperty ?? "key";
    const propertyLabel = this._filterProperty ?? "label";

    this.filterOptions = this._data
      .map((element) => ({
        id: element[propertyId],
        label: element[propertyLabel] || "",
      }))
      .filter(onlyUniqueIds)
      .filter((e) => e.id !== this.FILTER_VALUE_ALL) // "All" option added natively
      .sort((a, b) => {
        return String(a.label).localeCompare(b.label);
      });

    function onlyUniqueIds(value, index, self) {
      return self.findIndex((v) => v.id === value.id) === index;
    }
  }

  selectOption(selectedOptionValue: string) {
    this.selectedOption = selectedOptionValue;
    this.selectedOptionChange.emit(selectedOptionValue);
    this.selectedFilterFunction.emit(
      (element) => element[this.filterProperty] === selectedOptionValue
    );
  }
}
