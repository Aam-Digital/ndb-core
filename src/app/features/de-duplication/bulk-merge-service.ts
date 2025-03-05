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
   * Opens the merge popup and merges the selected entities.
   *
   * @param entitiesToMerge The entities to merge.
   * @param entityType The type of the entities.
   */
  async showMergeDialog<E extends Entity>(
    entitiesToMerge: E[],
    entityType: EntityConstructor,
  ): Promise<void> {
    if (entitiesToMerge.length !== 2) {
      this.alert.addWarning(
        $localize`You can only select 2 rows for merging right now.`,
      );
      return;
    }

    const dialogRef = this.matDialog.open(BulkMergeRecordsComponent, {
      maxHeight: "90vh",
      data: { entityConstructor: entityType, entitiesToMerge: entitiesToMerge },
    });
    const mergedEntity: E = await lastValueFrom(dialogRef.afterClosed());

    if (mergedEntity) {
      await this.entityMapper.save(mergedEntity);

      await this.entityMapper.remove(entitiesToMerge[1]);
      this.unsavedChangesService.pending = false;
      this.alert.addInfo($localize`Records merged successfully.`);
    }
  }
}
