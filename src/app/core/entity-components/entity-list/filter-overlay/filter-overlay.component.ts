import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FilterComponentSettings } from "../filter-component.settings";

export interface FilterOverlayData {
  filterSelections: FilterComponentSettings<any>[];
  filterChangeCallback: (
    filter: FilterComponentSettings<any>,
    option: string
  ) => void;
}

@Component({
  selector: "app-filter-overlay",
  templateUrl: "./filter-overlay.component.html",
  styleUrls: ["./filter-overlay.component.scss"],
})
export class FilterOverlayComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: FilterOverlayData) {}

  ngOnInit(): void {}

  optionDidChange(filter: FilterComponentSettings<any>, option: string) {
    this.data.filterChangeCallback(filter, option);
  }
}
