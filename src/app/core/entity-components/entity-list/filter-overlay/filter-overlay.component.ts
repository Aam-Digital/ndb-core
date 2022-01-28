import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FilterComponentSettings } from "../filter-component.settings";
import { Entity } from "../../../entity/model/entity";

export interface FilterOverlayData<T extends Entity> {
  filterSelections: FilterComponentSettings<T>[];
  filterChangeCallback: (
    filter: FilterComponentSettings<T>,
    option: string
  ) => void;
}

@Component({
  selector: "app-filter-overlay",
  templateUrl: "./filter-overlay.component.html",
})
export class FilterOverlayComponent<T extends Entity> {
  constructor(@Inject(MAT_DIALOG_DATA) public data: FilterOverlayData<T>) {}

  optionDidChange(filter: FilterComponentSettings<T>, option: string) {
    this.data.filterChangeCallback(filter, option);
  }
}
