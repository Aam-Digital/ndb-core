import { Component, computed, input } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource } from "../hierarchy-data-source";

/**
 * Shown after the title of a collapsed row in a hierarchy (row options of the {@link HierarchyDataSource}):
 * the number of its hidden sub-records, e.g. "(3)".
 * Hidden from screen readers, the expand button of the row names the number.
 */
@Component({
  selector: "app-hierarchy-child-count",
  template: "({{ childCount() }})",
  styleUrl: "./hierarchy-child-count.component.scss",
  host: { "aria-hidden": "true" },
})
export class HierarchyChildCountComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();
  recordId = input.required<string>();

  protected readonly childCount = computed(
    () => this.dataSource().rows().get(this.recordId())?.childCount,
  );
}
