import { CommonModule } from "@angular/common";
import { inject, Injector, NgModule } from "@angular/core";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityEditService } from "./entity-edit.service";
import { asArray } from "#src/app/utils/asArray";
import { Logging } from "#src/app/core/logging/logging.service";
import { AlertService } from "#src/app/core/alerts/alert.service";
import {
  KnownMultiTabCorruptionHandledError,
  MultiTabOperationBlockedError,
} from "#src/app/core/database/pouchdb/known-multi-tab-corruption-handled.error";

/**
 * Feature module for bulk editing multiple entities at once.
 */
@NgModule({
  imports: [CommonModule],
})
export class BulkEditModule {
  constructor() {
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const injector = inject(Injector);
    const alertService = inject(AlertService);

    entityActionsMenuService.registerActions([
      {
        action: "bulk-edit",
        label: $localize`:entity context menu:Bulk Edit`,
        icon: "edit",
        tooltip: $localize`:entity context menu tooltip:Edit multiple records at once.`,
        availableFor: "bulk-only",
        permission: "update",
        execute: async (entities: Entity | Entity[]) => {
          const entityEditService = injector.get(EntityEditService); // only inject lazily
          entities = asArray(entities);
          if (!entities.length) return false;
          const entityType = entities[0].getConstructor();
          if (!entityType) return false;

          return entityEditService
            .edit(entities, entityType)
            .catch(async (error) => {
              Logging.warn("Bulk edit failed", error);
              if (
                error instanceof MultiTabOperationBlockedError ||
                error instanceof KnownMultiTabCorruptionHandledError
              ) {
                // Guard/recovery dialog is already handled by EntityMapperService.
                return false;
              }

              alertService.addDanger(
                $localize`:Bulk edit error message:Bulk edit failed. Please try again.`,
              );
              return false;
            });
        },
      },
    ]);
  }
}
