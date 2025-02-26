import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../model/entity";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { EntityActionsService } from "./entity-actions.service";
import { BulkMergeRecordsComponent } from "app/core/entity-list/bulk-merge-records/bulk-merge-records.component";
import { AlertService } from "app/core/alerts/alert.service";

@Injectable({
  providedIn: "root",
})
export class EntityMergeService {
  constructor(
    private entityMapper: EntityMapperService,
    private matDialog: MatDialog,
    private entityActionsService: EntityActionsService,
    private alert: AlertService,
  ) {}

  /**
   * Opens the merge popup and merges the selected entities.
   *
   * @param entitiesToMerge The entities to merge.
   * @param entityType The type of the entities.
   */
  async merge<E extends Entity>(
    entitiesToMerge: E[],
    entityType: EntityConstructor,
  ): Promise<void> {
    if (entitiesToMerge.length !== 2) {
      this.alert.addWarning(
        "You can only select 2 rows for merging right now.",
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
      this.alert.addWarning("Records merged successfully.");
    }
  }
}
