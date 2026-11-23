import { inject, Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { catchError, lastValueFrom, of } from "rxjs";
import {
  BulkMergeRecordsComponent,
  MergeDialogResult,
} from "app/features/de-duplication/bulk-merge-records/bulk-merge-records.component";
import { AccountMergeDecision } from "./bulk-merge-records/merge-account-section/merge-account-section.component";
import { asArray } from "#src/app/utils/asArray";
import { AlertService } from "app/core/alerts/alert.service";
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
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly userAdminService = inject(UserAdminService);

  /**
   * Validates selection and opens the merge dialog for the given entities.
   * Returns true if merge was executed, false otherwise.
   */
  async executeAction(entity: Entity | Entity[]): Promise<boolean> {
    const entities = asArray(entity);
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
   * Opens the merge dialog for the selected entities.
   *
   * @param entitiesToMerge The entities to merge.
   * @param entityType The type of the entities.
   */
  async showMergeDialog<E extends Entity>(
    entitiesToMerge: E[],
    entityType: EntityConstructor,
  ): Promise<boolean> {
    const dialogRef = this.matDialog.open(BulkMergeRecordsComponent, {
      maxHeight: "90vh",
      data: {
        entityConstructor: entityType,
        entitiesToMerge: entitiesToMerge,
      },
    });
    const dialogResult: MergeDialogResult<E> | undefined = await lastValueFrom(
      dialogRef.afterClosed(),
    );

    if (!dialogResult) return false;

    await this.executeMerge(
      dialogResult.mergedEntity,
      entitiesToMerge,
      dialogResult.entityAccounts,
      dialogResult.deleteSecondaryAccount,
      dialogResult.accountUpdate,
    );
    // the merge dialog's form is already destroyed (and thus its unsaved-changes state cleared)
    // by the time we reach here, since we awaited its `afterClosed()` above.
    this.alert.addInfo($localize`Records merged successfully.`);
    return true;
  }

  /**
   * Merges the selected entities into a single entity.
   * deletes the other entities.
   *
   * @param mergedEntity The merged entity.
   * @param entitiesToMerge
   * @param entityAccounts Accounts explicitly fetched for each entity; only accounts
   *   that were actually found will be deleted during merge.
   * @param deleteSecondaryAccount Whether account of the discarded record should be deleted.
   *   If false, the account remains and may become orphaned.
   * @param accountUpdate Optional update payload for the surviving account (e.g. role changes).
   */
  async executeMerge<E extends Entity>(
    mergedEntity: E,
    entitiesToMerge: E[],
    entityAccounts?: (UserAccount | null)[],
    deleteSecondaryAccount: boolean = true,
    accountUpdate?: AccountMergeDecision["accountUpdate"],
  ): Promise<void> {
    await this.entityMapper.save(mergedEntity);

    for (const [i, discarded] of entitiesToMerge.entries()) {
      if (discarded.getId() === mergedEntity.getId()) continue;

      if (deleteSecondaryAccount && entityAccounts?.[i]) {
        await this.deleteAccount(discarded);
      }
      await this.moveLinks(discarded, mergedEntity);
      await this.entityMapper.remove(discarded);
    }

    if (accountUpdate) {
      await this.updateAccount(accountUpdate);
    }
  }

  /** Delete the user account of the entity; a failure leaves the account behind without stopping the merge. */
  private async deleteAccount(entity: Entity): Promise<void> {
    await lastValueFrom(
      this.userAdminService
        .deleteUser(entity.getId())
        .pipe(catchError(() => of({ userDeleted: false }))),
    );
  }

  /** Change the links to the discarded entity in all related records to the merged entity. */
  private async moveLinks(discarded: Entity, merged: Entity): Promise<void> {
    const linkingRecords =
      await this.entityRelationshipService.loadAllLinkingToEntity(discarded);
    for (const { entity, fields } of linkingRecords) {
      await this.relinkRecord(
        entity,
        fields,
        discarded.getId(),
        merged.getId(),
      );
    }
  }

  /** Replace the link to the old id with the new id in the fields of the related record and save it. */
  private async relinkRecord(
    record: Entity,
    fields: FormFieldConfig[],
    oldId: string,
    newId: string,
  ): Promise<void> {
    for (const { id: refFieldId } of fields) {
      if (Array.isArray(record[refFieldId])) {
        record[refFieldId] = Array.from(
          new Set(record[refFieldId].map((id) => (id === oldId ? newId : id))),
        );
      } else if (record[refFieldId] === oldId) {
        record[refFieldId] = newId;
      }
    }

    this.updateAttendanceFields(record, oldId, newId);

    await this.entityMapper.save(record);
  }

  /**
   * Update the user account of the merged entity (e.g. its roles).
   * As the records are already merged, a failure is only shown to the user.
   */
  private async updateAccount({
    accountId,
    update,
  }: NonNullable<AccountMergeDecision["accountUpdate"]>): Promise<void> {
    const result = await lastValueFrom(
      this.userAdminService
        .updateUser(accountId, update)
        .pipe(catchError(() => of({ userUpdated: false }))),
    );
    if (!result.userUpdated) {
      await this.confirmationDialog.getConfirmation(
        $localize`:Account update error title:Account update failed`,
        $localize`:Account update error:The merge completed but the user account roles could not be updated. Please update them manually or contact support.`,
        OkButton,
      );
    }
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
