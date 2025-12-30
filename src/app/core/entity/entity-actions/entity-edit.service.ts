import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { CascadingEntityAction } from "./cascading-entity-action";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { lastValueFrom } from "rxjs";
import {
  BulkEditAction,
  EntityBulkEditComponent,
} from "./entity-bulk-edit/entity-bulk-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsService } from "./entity-actions.service";
import { asArray } from "app/utils/asArray";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { BulkOperationStateService } from "./bulk-operation-state.service";

/**
 * Bulk edit fields of multiple entities at once.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  private matDialog = inject(MatDialog);
  private entityActionsService = inject(EntityActionsService);
  private unsavedChanges = inject(UnsavedChangesService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
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

    const progressDialog = this.confirmationDialog.showProgressDialog(
      $localize`:Bulk edit progress message:Updating ${newEntities.length}:count: records...`,
    );
    this.bulkOperationState.startBulkOperation(progressDialog);
    await this.entityMapper.saveAll(newEntities);

    this.unsavedChanges.pending = false;

    return {
      success: true,
      originalEntities,
      newEntities,
    };
  }
}
