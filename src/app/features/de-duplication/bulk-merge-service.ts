import { Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { BulkMergeRecordsComponent } from "app/features/de-duplication/bulk-merge-records/bulk-merge-records.component";
import { AlertService } from "app/core/alerts/alert.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "app/core/entity/entity-actions/cascading-entity-action";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { Note } from "app/child-dev-project/notes/model/note";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EventAttendanceMap } from "app/child-dev-project/attendance/model/event-attendance";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";

@Injectable({
  providedIn: "root",
})
export class BulkMergeService extends CascadingEntityAction {
  constructor(
    protected override entityMapper: EntityMapperService,
    protected override schemaService: EntitySchemaService,
    private entityRelationshipService: EntityRelationsService,
    private matDialog: MatDialog,
    private alert: AlertService,
    private unsavedChangesService: UnsavedChangesService,
    private entityRegistry: EntityRegistry,
  ) {
    super(entityMapper, schemaService, entityRelationshipService);
  }

  /**
   * Opens the merge popup with the selected entities details.
   *
   * @param entitiesToMerge The entities to merge.
   * @param entityType The type of the entities.
   */
  async showMergeDialog<E extends Entity>(
    entitiesToMerge: E[],
    entityType: EntityConstructor,
  ): Promise<void> {
    const dialogRef = this.matDialog.open(BulkMergeRecordsComponent, {
      maxHeight: "90vh",
      data: { entityConstructor: entityType, entitiesToMerge: entitiesToMerge },
    });
    const mergedEntity: E = await lastValueFrom(dialogRef.afterClosed());

    if (mergedEntity) {
      await this.executeMerge(mergedEntity, entitiesToMerge);

      this.unsavedChangesService.pending = false;
      this.alert.addInfo($localize`Records merged successfully.`);
    }
  }

  /**
   * Merges the selected entities into a single entity.
   * deletes the other entities.
   *
   * @param mergedEntity The merged entity.
   * @param entitiesToMerge
   */
  async executeMerge<E extends Entity>(
    mergedEntity: E,
    entitiesToMerge: E[],
  ): Promise<void> {
    await this.entityMapper.save(mergedEntity);

    // Process all entities to be deleted
    for (let e of entitiesToMerge) {
      if (e.getId() === mergedEntity.getId()) continue;

      await this.updateRelatedRefId(e, mergedEntity);

      await this.entityMapper.remove(e);
    }
  }

  /**
   * Update references from the entity being deleted to the merged entity
   */
  private async updateRelatedRefId(
    oldEntity: Entity,
    newEntity: Entity,
  ): Promise<void> {
    const affectedEntities =
      await this.entityRelationsService.loadAllLinkingToEntity(oldEntity);
    console.log(affectedEntities, "affectedEntities");
    // for (const affected of affectedEntities) {

    await this.cascadeActionToRelatedEntities(
      oldEntity,
      async (relatedEntity, refField) => {
        return await this.updateEntityReferences(
          relatedEntity,
          oldEntity,
          newEntity,
          refField,
        );
      },
      (relatedEntity, refField) =>
        this.updateEntityReferences(
          relatedEntity,
          oldEntity,
          newEntity,
          refField,
        ),
    );
  }

  /**
   * Updates references from the oldEntity to the newEntity in a related entity.
   */
  private async updateEntityReferences(
    relatedEntity: Entity,
    oldEntity: Entity,
    newEntity: Entity,
    refField: string,
  ): Promise<CascadingActionResult> {
    const originalEntity = relatedEntity.copy();
    const oldId = oldEntity.getId();
    const newId = newEntity.getId();

    const fieldsToUpdate = refField ? [refField] : Object.keys(relatedEntity);

    for (const key of fieldsToUpdate) {
      if (Array.isArray(relatedEntity[key])) {
        relatedEntity[key] = Array.from(
          new Set(relatedEntity[key].map((id) => (id === oldId ? newId : id))),
        );
      } else if (relatedEntity[key] === oldId) {
        relatedEntity[key] = newId;
      }
    }

    if (relatedEntity instanceof Note && refField === "children") {
      const childrenAttendance = (relatedEntity as any)
        .childrenAttendance as EventAttendanceMap;
      if (childrenAttendance.has(oldId)) {
        childrenAttendance.set(newId, childrenAttendance.get(oldId));
        childrenAttendance.delete(oldId);
      }
    }

    await this.entityMapper.save(relatedEntity);
    return new CascadingActionResult([originalEntity]);
  }
}
