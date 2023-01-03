import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { DataFilter } from "../../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterConfig } from "../../entity-components/entity-list/EntityListConfig";

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
})
export class FilterOverlayComponent<T extends Entity> {
  constructor(@Inject(MAT_DIALOG_DATA) public data: FilterOverlayData<T>) {}
}
