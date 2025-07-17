import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterConfig } from "../../entity-list/EntityListConfig";
import { FilterComponent } from "../filter/filter.component";
import { MatButtonModule } from "@angular/material/button";
import { DataFilter } from "../filters/filters";

export interface FilterOverlayData<T extends Entity> {
  filterConfig: FilterConfig[];
  entityType: EntityConstructor<T>;
  entities: T[];
  useUrlQueryParams: true;
  filterObjChange: (filter: DataFilter<T>) => void;
}

/**
 * The component that shows filter options on small screens
 * via a popover instead of the menu
 */
@Component({
  selector: "app-filter-overlay",
  templateUrl: "./filter-overlay.component.html",
  styles: [":host { display: block }"],
  imports: [MatDialogModule, FilterComponent, MatButtonModule],
})
export class FilterOverlayComponent<T extends Entity> {
  data = inject<FilterOverlayData<T>>(MAT_DIALOG_DATA);
}
