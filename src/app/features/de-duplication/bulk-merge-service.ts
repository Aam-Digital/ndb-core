import { inject, Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { BulkMergeRecordsComponent } from "app/features/de-duplication/bulk-merge-records/bulk-merge-records.component";
import { AlertService } from "app/core/alerts/alert.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { Note } from "app/child-dev-project/notes/model/note";
import { EventAttendanceMap } from "../attendance/model/event-attendance.datatype";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

@Injectable({
  providedIn: "root",
})
export class BulkMergeService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRelationshipService = inject(EntityRelationsService);
  private readonly matDialog = inject(MatDialog);
  private readonly alert = inject(AlertService);
  private readonly unsavedChangesService = inject(UnsavedChangesService);

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
      await this.entityRelationshipService.loadAllLinkingToEntity(oldEntity);
    for (const affected of affectedEntities) {
      await this.updateEntityReferences(
        affected.entity,
        oldEntity,
        newEntity,
        affected.fields,
      );
    }
  }

  /**
   * Updates references from the oldEntity to the newEntity in a related entity.
   */
  private async updateEntityReferences(
    relatedEntity: Entity,
    oldEntity: Entity,
    newEntity: Entity,
    refField: FormFieldConfig[],
  ): Promise<void> {
    const oldId = oldEntity.getId();
    const newId = newEntity.getId();
    const refFieldId = refField[0].id;

    if (Array.isArray(relatedEntity[refFieldId])) {
      relatedEntity[refFieldId] = Array.from(
        new Set(
          relatedEntity[refFieldId].map((id) => (id === oldId ? newId : id)),
        ),
      );
    } else if (relatedEntity[refFieldId] === oldId) {
      relatedEntity[refFieldId] = newId;
    }

    if (relatedEntity instanceof Note && refFieldId === "children") {
      this.updateChildrenAttendance(relatedEntity, oldId, newId);
    }

    await this.entityMapper.save(relatedEntity);
  }

  /**
   * Helper method to updates the attendance records of children in a Note entity by replacing
   * references to the old entity ID with the new entity ID.
   */
  private updateChildrenAttendance(
    relatedEntity: Note,
    oldId: string,
    newId: string,
  ): void {
    const childrenAttendance = (relatedEntity as any)
      .childrenAttendance as EventAttendanceMap;
    if (childrenAttendance.has(oldId)) {
      childrenAttendance.set(newId, childrenAttendance.get(oldId));
      childrenAttendance.delete(oldId);
    }
  }
}
