import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterConfig } from "../../entity-list/EntityListConfig";
import { FilterComponent } from "../filter/filter.component";
import { MatButtonModule } from "@angular/material/button";
import { DataFilter } from "../filters/filters";
import { EntitiesTableDataSource } from "../../common-components/entities-table/data-source/entities-table-data-source";

export interface FilterOverlayData<T extends Entity> {
  filterConfig: FilterConfig[];
  entityType: EntityConstructor<T>;
  entities: T[];
  useUrlQueryParams: true;
  filterObjChange: (filter: DataFilter<T>) => void;
  /** the data source of the filtered table, so that "Clear" also resets its free-text search */
  dataSource?: EntitiesTableDataSource<T>;
}

/**
 * The component that shows filter options on small screens
 * via a popover instead of the menu
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-filter-overlay",
  templateUrl: "./filter-overlay.component.html",
  styles: [":host { display: block }"],
  imports: [MatDialogModule, FilterComponent, MatButtonModule],
})
export class FilterOverlayComponent<T extends Entity> {
  data = inject<FilterOverlayData<T>>(MAT_DIALOG_DATA);
}
