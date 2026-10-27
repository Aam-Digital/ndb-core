import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { CascadingEntityAction } from "#src/app/core/entity/entity-actions/cascading-entity-action";
import { lastValueFrom } from "rxjs";
import {
  BulkEditAction,
  EntityBulkEditComponent,
} from "#src/app/core/entity/entity-actions/entity-bulk-edit/entity-bulk-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";
import { asArray } from "#src/app/utils/asArray";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";
import { AutomatedFieldUpdateConfigService } from "#src/app/features/inherited-field/automated-field-update/automated-field-update-config.service";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Bulk edit fields of multiple entities at once.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  private readonly matDialog = inject(MatDialog);
  private readonly entityActionsService = inject(EntityActionsService);
  private readonly bulkOperationState = inject(BulkOperationStateService);
  private readonly automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );
  private readonly alertService = inject(AlertService);

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
      const updatedRelatedRecords = await this.updateRelatedRecords(
        result.newEntities,
        result.originalEntities,
      );
      this.entityActionsService.showSnackbarConfirmationWithUndo(
        this.entityActionsService.generateMessageForConfirmationWithUndo(
          entities,
          $localize`:Entity action confirmation message verb:edited`,
        ),
        [...result.originalEntities, ...updatedRelatedRecords],
      );
    }
    return true;
  }

  /**
   * Offer to update the records that automation rules link to the edited records, as editing a single record does.
   * @return the updated records as they were before, so that undo reverts them too
   */
  private async updateRelatedRecords(
    newEntities: Entity[],
    originalEntities: Entity[],
  ): Promise<Entity[]> {
    try {
      return await this.automatedFieldUpdateConfigService.applyRulesToDependentEntities(
        newEntities,
        originalEntities,
      );
    } catch (error) {
      Logging.error(
        "Bulk edit could not update the linked records after saving",
        error,
      );
      this.alertService.addDanger(
        $localize`The linked records could not be updated.`,
      );
      return [];
    }
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
