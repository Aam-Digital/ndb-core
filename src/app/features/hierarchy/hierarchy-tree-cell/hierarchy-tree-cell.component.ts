import { Component, computed, input } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource } from "../hierarchy-data-source";
import { HierarchyRow } from "../hierarchy-tree";

/**
 * Shown before the first cell of a row in a hierarchy (a row decoration of the {@link HierarchyDataSource}):
 * the indentation of the record's level with lines connecting it to its parent and siblings,
 * and the button to expand or collapse its sub-records.
 */
@Component({
  selector: "app-hierarchy-tree-cell",
  imports: [FaDynamicIconComponent, MatTooltipModule],
  templateUrl: "./hierarchy-tree-cell.component.html",
  styleUrl: "./hierarchy-tree-cell.component.scss",
})
export class HierarchyTreeCellComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();
  recordId = input.required<string>();

  /**
   * The tree position of the record. The tree builds new row objects whenever it changes,
   * so this compares what the cell shows: otherwise every cell would render again on any change.
   */
  protected readonly row = computed(
    () => this.dataSource().rows().get(this.recordId()),
    { equal: isSameTreeCell },
  );

  protected toggle() {
    this.dataSource().toggleCollapsed(this.recordId());
  }
}

function isSameTreeCell(a?: HierarchyRow, b?: HierarchyRow): boolean {
  return (
    a?.level === b?.level &&
    a?.childCount === b?.childCount &&
    a?.isContext === b?.isContext &&
    a?.isCollapsed === b?.isCollapsed &&
    a?.isLastChild === b?.isLastChild &&
    a?.ancestorsContinue.join() === b?.ancestorsContinue.join()
  );
}
