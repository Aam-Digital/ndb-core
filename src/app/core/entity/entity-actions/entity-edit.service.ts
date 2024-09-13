import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { CascadingEntityAction } from "./cascading-entity-action";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { lastValueFrom } from "rxjs";
import { EntityBulkEditComponent } from "./entity-bulk-edit/entity-bulk-edit.component";
import { MatDialog } from "@angular/material/dialog";
import { EntityActionsService } from "./entity-actions.service";

/**
 * Safely edit an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
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
   * @param entityParam The entity to edit
   */
  async edit<E extends Entity>(
    entityParam: E | E[],
    entityConstructor?: EntityConstructor,
  ): Promise<boolean> {
    let entities = Array.isArray(entityParam) ? entityParam : [entityParam];
    const dialogRef = this.matDialog.open(EntityBulkEditComponent, {
      maxHeight: "90vh",
      data: { entityConstructor, selectedRow: entities },
    });
    const results = await lastValueFrom(dialogRef.afterClosed());
    if (results) {
      const result = await this.editEntity(results, entityParam);
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
    updatedEntity: { selectedField: string; label: E | E[] },
    entitiesToEdit: E | E[],
  ): Promise<{ success: boolean; originalEntities: E[]; newEntities: E[] }> {
    if (updatedEntity) {
      let originalEntities: E[] = Array.isArray(entitiesToEdit)
        ? entitiesToEdit
        : [entitiesToEdit];
      const newEntities: E[] = originalEntities.map((e) => e.copy());

      for (const e of newEntities) {
        e[updatedEntity.selectedField] = updatedEntity.label;
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
}
