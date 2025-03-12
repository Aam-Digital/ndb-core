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

@Injectable({
  providedIn: "root",
})
export class BulkMergeService extends CascadingEntityAction {
  constructor(
    protected override entityMapper: EntityMapperService,
    protected override schemaService: EntitySchemaService,
    private matDialog: MatDialog,
    private alert: AlertService,
    private unsavedChangesService: UnsavedChangesService,
  ) {
    super(entityMapper, schemaService);
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
    for (let e of entitiesToMerge) {
      this.getrelatedEntities(e);
    }
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

  async getrelatedEntities(entity: Entity): Promise<CascadingActionResult> {
    console.log(entity, "test");
    const cascadeResult = await this.cascadeActionToRelatedEntities(
      entity,
      (e) => this.getrelatedEntities(e),
      (e, refField, entity) => this.getrelatedEntities(e), //need to add method which will update the reference entity id with merged id
    );

    return new CascadingActionResult([entity]).mergeResults(cascadeResult);
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
