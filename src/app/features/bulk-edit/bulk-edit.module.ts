import { CommonModule } from "@angular/common";
import { inject, NgModule } from "@angular/core";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityEditService } from "./entity-edit.service";

/**
 * Feature module for bulk editing multiple entities at once.
 */
@NgModule({
  imports: [CommonModule],
})
export class BulkEditModule {
  constructor() {
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const entityEditService = inject(EntityEditService);

    entityActionsMenuService.registerActions([
      {
        action: "bulk-edit",
        label: $localize`:entity context menu:Bulk Edit`,
        icon: "edit",
        tooltip: $localize`:entity context menu tooltip:Edit multiple records at once.`,
        availableFor: "bulk-only",
        permission: "update",
        execute: async (entity: Entity | Entity[]) => {
          const entities = Array.isArray(entity) ? entity : [entity];
          if (!entities.length) return false;
          const entityType = entities[0].getConstructor();
          if (!entityType) return false;
          return entityEditService.edit(entities, entityType);
        },
      },
    ]);
  }
}
