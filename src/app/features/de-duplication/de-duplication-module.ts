import { Injector, NgModule, inject } from "@angular/core";
import { Routes } from "@angular/router";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { BulkMergeService } from "./bulk-merge-service";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { RoutedViewComponent } from "#src/app/core/ui/routed-view/routed-view.component";

@NgModule({})
export class DeDuplicationModule {
  static readonly routes: Routes = [
    {
      path: "review-duplicates",
      component: RoutedViewComponent,
      data: { component: "ReviewDuplicates" },
      canDeactivate: [
        () => inject(UnsavedChangesService).checkUnsavedChanges(),
      ],
    },
  ];
  constructor() {
    const components = inject(ComponentRegistry);
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const injector = inject(Injector);

    components.addAll(dynamicComponents);

    entityActionsMenuService.registerActions([
      {
        action: "merge",
        label: $localize`:entity context menu:Merge`,
        icon: "object-group",
        tooltip: $localize`:entity context menu tooltip:Merge two records into one, combining their data and deleting duplicates.`,
        availableFor: "bulk-only",
        permission: "update",
        execute: (entity) =>
          injector.get(BulkMergeService).executeAction(entity), // only inject lazily
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
  [
    "ReviewDuplicates",
    () =>
      import("./review-duplicates/review-duplicates.component").then(
        (c) => c.ReviewDuplicatesComponent,
      ),
  ],
];
