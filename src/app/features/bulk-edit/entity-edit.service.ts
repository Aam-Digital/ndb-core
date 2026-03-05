import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { CascadingEntityAction } from "#src/app/core/entity/entity-actions/cascading-entity-action";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { lastValueFrom } from "rxjs";
import {
  BulkEditAction,
  EntityBulkEditComponent,
} from "#src/app/core/entity/entity-actions/entity-bulk-edit/entity-bulk-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";
import { asArray } from "#src/app/utils/asArray";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";

/**
 * Bulk edit fields of multiple entities at once.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  private readonly matDialog = inject(MatDialog);
  private readonly entityActionsService = inject(EntityActionsService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly bulkOperationState = inject(BulkOperationStateService);

  /**
   * Shows a confirmation dialog to the user
   * and edit the entity if the user confirms.
   *
   * This also triggers a toast message, enabling the user to undo the action.
   *
   * @param entitiesToEdit The entities to apply a bulk edit to.
   * @param entityType
   */
  async edit<E extends Entity>(
    entitiesToEdit: E | E[],
    entityType: EntityConstructor,
  ): Promise<boolean> {
    let entities = asArray(entitiesToEdit);
    const dialogRef = this.matDialog.open(EntityBulkEditComponent, {
      maxHeight: "90vh",
      data: { entityConstructor: entityType, entitiesToEdit: entities },
    });
    const action: BulkEditAction = await lastValueFrom(dialogRef.afterClosed());

    if (action) {
      const result = await this.editEntity(action, entitiesToEdit);
      await this.bulkOperationState.waitForBulkOperationToFinish();
      this.entityActionsService.showSnackbarConfirmationWithUndo(
        this.entityActionsService.generateMessageForConfirmationWithUndo(
          entities,
          $localize`:Entity action confirmation message verb:edited`,
        ),
        result.originalEntities,
      );
    }
    return true;
  }

  async editEntity<E extends Entity>(
    action: BulkEditAction,
    entitiesToEdit: E | E[],
  ): Promise<{ success: boolean; originalEntities: E[]; newEntities: E[] }> {
    if (!action) {
      return;
    }

    let originalEntities: E[] = Array.isArray(entitiesToEdit)
      ? entitiesToEdit
      : [entitiesToEdit];
    const newEntities: E[] = originalEntities.map((e) => e.copy());

    for (const e of newEntities) {
      e[action.selectedField] = action.value;
    }

    this.bulkOperationState.startBulkOperation(
      newEntities.length,
      newEntities.map((entity) => entity.getId()),
    );

    try {
      // Use bulk save for performance - progress tracking happens in bulk-operation-state service
      await this.entityMapper.saveAll(newEntities);

      this.unsavedChanges.pending = false;
      return {
        success: true,
        originalEntities,
        newEntities,
      };
    } catch (error) {
      // On error, complete bulk operation immediately
      this.bulkOperationState.completeBulkOperation();
      throw error;
    }
  }
}
