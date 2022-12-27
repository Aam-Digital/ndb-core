import { Component, Inject } from "@angular/core";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";
import { FilterComponentSettings } from "../../entity-components/entity-list/filter-component.settings";
import { Entity } from "../../entity/model/entity";

export interface FilterOverlayData<T extends Entity> {
  filterSelections: FilterComponentSettings<T>[];
  filterChangeCallback: (
    filter: FilterComponentSettings<T>,
    option: string
  ) => void;
}

/**
 * The component that shows filter options on small screens
 * via a popover instead of the menu
 */
@Component({
  selector: "app-filter-overlay",
  templateUrl: "./filter-overlay.component.html",
  styles: [":host { display: block }"],
})
export class FilterOverlayComponent<T extends Entity> {
  constructor(@Inject(MAT_DIALOG_DATA) public data: FilterOverlayData<T>) {}

  optionDidChange(filter: FilterComponentSettings<T>, option: string) {
    this.data.filterChangeCallback(filter, option);
  }
}
