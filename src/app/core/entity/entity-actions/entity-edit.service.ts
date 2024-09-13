import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { CascadingEntityAction } from "./cascading-entity-action";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { lastValueFrom } from "rxjs";
import {
  BulkEditAction,
  EntityBulkEditComponent,
} from "./entity-bulk-edit/entity-bulk-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsService } from "./entity-actions.service";
import { asArray } from "../../../utils/utils";

/**
 * Bulk edit fields of multiple entities at once.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  constructor(
    protected override entityMapper: EntityMapperService,
    protected override schemaService: EntitySchemaService,
    private matDialog: MatDialog,
    private entityActionsService: EntityActionsService,
    private unsavedChanges: UnsavedChangesService,
  ) {
    super(entityMapper, schemaService);
  }

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
      await this.entityMapper.save(e);
    }

    this.unsavedChanges.pending = false;
    return {
      success: true,
      originalEntities,
      newEntities,
    };
  }
}
