import { inject, NgModule } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "../../core/entity/model/entity";
import { ChangeHistoryService } from "./change-history.service";
import { ChangeHistoryDialogComponent } from "./change-history-dialog/change-history-dialog.component";

export { AUDIT_RECORD_SUBJECT } from "./change-history.service";

function asSingle(entity: Entity | Entity[]): Entity | undefined {
  return Array.isArray(entity) ? entity[0] : entity;
}

/**
 * Registers the global "View change history" entity action, surfacing the
 * change-history dialog in the entity-details three-dot menu for every entity
 * type. No per-type configuration is needed.
 */
@NgModule({})
export class ChangeHistoryModule {
  private readonly entityActionsMenu = inject(EntityActionsMenuService);
  private readonly dialog = inject(MatDialog);
  private readonly changeHistory = inject(ChangeHistoryService);

  constructor() {
    this.entityActionsMenu.registerActions([
      {
        action: "view-change-history",
        label: $localize`:entity context menu:View change history`,
        icon: "clock-rotate-left",
        tooltip: $localize`:entity context menu tooltip:Show who changed this record, when, and what changed.`,
        availableFor: "individual-only",
        execute: async (entity) => {
          const single = asSingle(entity);
          if (single) {
            ChangeHistoryDialogComponent.open(this.dialog, single);
          }
          return false;
        },
        // shown to every user (not permission-gated) so the feature is
        // discoverable; the dialog itself shows a message if the user lacks
        // access or the feature is disabled
        visible: async (entity) =>
          this.changeHistory.canSeeHistoryEntry(asSingle(entity)),
      },
    ]);
  }
}
