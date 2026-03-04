import { NgModule, inject } from "@angular/core";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { BulkMergeService } from "./bulk-merge-service";

@NgModule({})
export class DeDuplicationModule {
  constructor() {
    const components = inject(ComponentRegistry);
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const bulkMergeService = inject(BulkMergeService);

    components.addAll(dynamicComponents);

    entityActionsMenuService.registerActions([
      {
        action: "merge",
        label: $localize`:entity context menu:Merge`,
        icon: "object-group",
        tooltip: $localize`:entity context menu tooltip:Merge two records into one, combining their data and deleting duplicates.`,
        availableFor: "bulk-only",
        permission: "update",
        execute: (entity) => bulkMergeService.executeAction(entity),
      },
    ]);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "BulkMergeRecordsComponent",
    () =>
      import("./bulk-merge-records/bulk-merge-records.component").then(
        (c) => c.BulkMergeRecordsComponent,
      ),
  ],
];
