import { inject, Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { catchError, lastValueFrom, of } from "rxjs";
import { BulkMergeRecordsComponent } from "app/features/de-duplication/bulk-merge-records/bulk-merge-records.component";
import { AlertService } from "app/core/alerts/alert.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { AttendanceItem } from "../attendance/model/attendance-item";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { AttendanceDatatype } from "../attendance/model/attendance.datatype";
import { EventAttendanceMapDatatype } from "../attendance/deprecated/event-attendance-map.datatype";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { UserAccount } from "app/core/user/user-admin-service/user-account";

@Injectable({
  providedIn: "root",
})
export class BulkMergeService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRelationshipService = inject(EntityRelationsService);
  private readonly matDialog = inject(MatDialog);
  private readonly alert = inject(AlertService);
  private readonly unsavedChangesService = inject(UnsavedChangesService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly userAdminService = inject(UserAdminService);

  /**
   * Validates selection and opens the merge dialog for the given entities.
   * Returns true if merge was executed, false otherwise.
   */
  async executeAction(entity: Entity | Entity[]): Promise<boolean> {
    const entities = Array.isArray(entity) ? entity : [entity];
    if (entities.length !== 2) {
      await this.confirmationDialog.getConfirmation(
        $localize`:bulk merge error:Invalid selection`,
        $localize`:bulk merge error:You need to select exactly two records for merge.`,
        OkButton,
      );
      return false;
    }
    const entityType = entities[0].getConstructor();
    if (!entityType) return false;
    return this.showMergeDialog(entities, entityType);
  }

  /**
   * Opens the merge popup with the selected entities details.
   * Checks for linked user accounts, ensures the account-holder is the primary
   * entity (whose ID is retained), and warns if both entities have accounts.
   *
   * @param entitiesToMerge The entities to merge.
   * @param entityType The type of the entities.
   */
  async showMergeDialog<E extends Entity>(
    entitiesToMerge: E[],
    entityType: EntityConstructor,
  ): Promise<boolean> {
    const entityAccounts = await Promise.all(
      entitiesToMerge.map((e) => this.getUserAccount(e)),
    );

    // Ensure the entity with a user account is at index 0 (primary, whose ID is retained)
    if (!entityAccounts[0] && entityAccounts[1]) {
      entitiesToMerge = [entitiesToMerge[1], entitiesToMerge[0]];
      entityAccounts.reverse();
    }

    // Warn if any entity has an account and explain outcomes for both single-account and both-account cases.
    const accountsFound = entityAccounts.filter((account) => account != null);
    if (accountsFound.length > 0) {
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:merge account warning title:Warning! User account(s) found`,
        $localize`:merge account warning:At least one selected record has a linked user account.\nIf only one record has an account, that record is kept as "Record A" and the account remains linked after merge.\nIf both records have accounts, the account linked to "Record B" will be deleted.\nAre you sure you want to continue?`,
      );
      if (!confirmed) return false;
    }

    const dialogRef = this.matDialog.open(BulkMergeRecordsComponent, {
      maxHeight: "90vh",
      data: {
        entityConstructor: entityType,
        entitiesToMerge: entitiesToMerge,
        entityAccounts: entityAccounts,
      },
    });
    const mergedEntity: E | undefined = await lastValueFrom(
      dialogRef.afterClosed(),
    );

    if (!mergedEntity) return false;

    await this.executeMerge(mergedEntity, entitiesToMerge);
    this.unsavedChangesService.pending = false;
    this.alert.addInfo($localize`Records merged successfully.`);
    return true;
  }

  /**
   * Get the user account linked to the given entity, or null if none exists.
   */
  private async getUserAccount(entity: Entity): Promise<UserAccount | null> {
    if (!entity.getConstructor()?.enableUserAccounts) return null;
    return lastValueFrom(
      this.userAdminService.getUser(entity.getId()).pipe(
        catchError((err) => {
          if (err?.status === 404) return of(null);
          throw err;
        }),
      ),
    );
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

      // Delete any linked user account for the entity being discarded
      if (e.getConstructor()?.enableUserAccounts) {
        await lastValueFrom(
          this.userAdminService
            .deleteUser(e.getId())
            .pipe(catchError(() => of({ userDeleted: false }))),
        );
      }

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

    this.updateAttendanceFields(relatedEntity, oldId, newId);

    await this.entityMapper.save(relatedEntity);
  }

  /**
   * Updates participant references in all attendance-type fields of the related entity.
   * This handles any field with dataType "attendance" or "event-attendance-map".
   */
  private updateAttendanceFields(
    relatedEntity: Entity,
    oldId: string,
    newId: string,
  ): void {
    const attendanceDataTypes = [
      AttendanceDatatype.dataType,
      EventAttendanceMapDatatype.dataType,
    ];

    const schema = relatedEntity.getConstructor().schema;
    for (const [fieldId, field] of schema.entries()) {
      if (!attendanceDataTypes.includes(field.dataType)) {
        continue;
      }

      const attendance: AttendanceItem[] = relatedEntity[fieldId];
      if (Array.isArray(attendance)) {
        for (const item of attendance) {
          if (item.participant === oldId) {
            item.participant = newId;
          }
        }
      }
    }
  }
}
