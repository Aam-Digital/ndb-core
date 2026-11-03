import { Component, computed, input } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource } from "../hierarchy-data-source";

/**
 * Shown before the first cell of a row in a hierarchy (a row decoration of the {@link HierarchyDataSource}):
 * the indentation of the record's level and the button to expand or collapse its sub-records.
 */
@Component({
  selector: "app-hierarchy-tree-cell",
  imports: [FaDynamicIconComponent, MatTooltipModule],
  templateUrl: "./hierarchy-tree-cell.component.html",
  styleUrl: "./hierarchy-tree-cell.component.scss",
  host: { "[style.--hierarchy-level]": "row()?.level ?? 0" },
})
export class HierarchyTreeCellComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();
  recordId = input.required<string>();

  protected readonly row = computed(() =>
    this.dataSource().rows().get(this.recordId()),
  );

  protected toggle() {
    this.dataSource().toggleCollapsed(this.recordId());
  }
}
