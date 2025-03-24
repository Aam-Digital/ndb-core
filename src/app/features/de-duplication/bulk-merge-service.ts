import { Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { BulkMergeRecordsComponent } from "app/features/de-duplication/bulk-merge-records/bulk-merge-records.component";
import { AlertService } from "app/core/alerts/alert.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";

@Injectable({
  providedIn: "root",
})
export class BulkMergeService {
  constructor(
    private entityMapper: EntityMapperService,
    private matDialog: MatDialog,
    private alert: AlertService,
    private unsavedChangesService: UnsavedChangesService,
  ) {}

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

    for (let e of entitiesToMerge) {
      if (e.getId() === mergedEntity.getId()) continue;

      await this.entityMapper.remove(e);
    }
  }
}
