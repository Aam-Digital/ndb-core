import { inject, Injectable, signal } from "@angular/core";
import { BackupService } from "../backup/backup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import {
  CustomYesNoButtons,
  DELETE_CONFIRMATION_KEYWORD,
  OkButton,
} from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { LOCATION_TOKEN, NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Database } from "../../database/database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ImportMetadata } from "../../import/import-metadata";
import {
  UserAdminApiError,
  UserAdminService,
} from "../../user/user-admin-service/user-admin.service";
import { SessionSubject } from "../../session/auth/session-info";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../logging/logging.service";

/**
 * Which records have to be kept when deleting all records,
 * because a login account is linked to them as its "profile".
 */
interface UserProfilesToKeep {
  /** ids of the records that a login account is linked to */
  linkedProfileIds: Set<string>;

  /**
   * Whether the login accounts could actually be looked up.
   *
   * If false (e.g. missing permissions, no user management server or offline),
   * all records of types that can have user accounts are kept instead,
   * because it is unknown which of them are linked to an account.
   */
  accountsVerified: boolean;
}

/**
 * Admin actions to bulk-delete records ("Empty Records") or reset the whole
 * system ("Reset System").
 *
 * This owns both what exactly is deleted and the confirmation dialogs, progress
 * feedback and undo option shown to the user, because the two have to say the
 * same thing: the dialog describes upfront what the deletion then does.
 */
@Injectable({
  providedIn: "root",
})
export class SystemResetService {
  private readonly backupService = inject(BackupService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly location = inject(LOCATION_TOKEN);
  private readonly dbResolver = inject(DatabaseResolverService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly userAdminService = inject(UserAdminService);
  private readonly sessionInfo = inject(SessionSubject, { optional: true });
  private readonly navigator = inject<Navigator>(NAVIGATOR_TOKEN, {
    optional: true,
  });

  /**
   * Internal entity types that document past data operations rather than system configuration.
   * These are deleted together with the records they refer to,
   * so that no import history remains offering to "undo" an import of records that no longer exist.
   */
  private static readonly DATA_HISTORY_TYPES: string[] = [
    ImportMetadata.ENTITY_TYPE,
  ];

  private readonly db: Database;

  constructor() {
    this.db = this.dbResolver.getDatabase();
    // WARNING: currently only the default "app" database is reset
  }

  /**
   * Delete all records of all record types, keeping the system configuration.
   */
  async emptyRecords() {
    if (!(await this.ensureDeletionPossible())) {
      return;
    }

    const profilesToKeep = await this.getUserProfilesToKeep();

    const confirmed = await this.confirmationDialog.getConfirmationWithKeyword(
      $localize`:Empty records confirmation title:Delete all records?`,
      $localize`:Empty records confirmation text:**IMPORTANT: Are you absolutely sure you want to delete all records?**

This deletes all existing records of all record types in the database (like all cases, all activities and all notes), including all files and photos attached to them. Attached files cannot be restored by the undo option.

Your system configuration (forms, dropdown options, reports, user roles) is kept. ${this.getKeptProfilesDescription(profilesToKeep)}

This step cannot be reverted easily, if at all. In case of doubt, download a backup before taking this step.`,
      DELETE_CONFIRMATION_KEYWORD,
      CustomYesNoButtons(
        $localize`:Empty records confirmation button:Yes, delete all records`,
        $localize`:Empty records cancel button:Cancel`,
      ),
    );

    if (!confirmed) {
      return;
    }

    // only export the whole database once the deletion is actually going ahead
    const restorePoint = await this.backupService.getDatabaseExport();

    const progressRef = this.confirmationDialog.showProgressDialog(
      signal($localize`Deleting all records ...`),
    );
    try {
      await this.deleteAllRecords(profilesToKeep);
    } finally {
      progressRef.close();
    }

    const snackBarRef = this.snackBar.open(
      $localize`All records deleted`,
      $localize`Undo`,
      { duration: 8000 },
    );
    snackBarRef.onAction().subscribe(async () => {
      await this.backupService.restoreData(restorePoint, true);
    });
  }

  /**
   * Delete everything, including the system configuration,
   * leaving a system that has to be set up from scratch.
   */
  async resetSystem() {
    if (!(await this.ensureDeletionPossible())) {
      return;
    }

    const confirmed = await this.confirmationDialog.getConfirmationWithKeyword(
      $localize`:Reset system confirmation title:Reset the whole system?`,
      $localize`:Reset system confirmation text:**IMPORTANT: Are you absolutely sure you want to reset this system?**

This deletes everything: all records of all record types including their attached files and photos, AND the complete configuration of your system (forms, fields, dropdown options, reports, templates, user roles and permissions).

Only your own user profile is kept, so that you can keep working with your account. The profiles of all other users are deleted as well (their login accounts themselves are not deleted here).

Afterwards you have to set up the system from scratch. This step cannot be reverted. Download a backup before taking this step.`,
      DELETE_CONFIRMATION_KEYWORD,
      CustomYesNoButtons(
        $localize`:Reset system confirmation button:Yes, reset the system`,
        $localize`:Reset system cancel button:Cancel`,
      ),
    );

    if (!confirmed) {
      return;
    }

    const progressRef = this.confirmationDialog.showProgressDialog(
      signal($localize`Resetting the system ...`),
    );
    try {
      await this.deleteEverything();
    } finally {
      progressRef.close();
    }

    // reload the app, which now starts up as a fresh system offering the initial setup
    this.location.pathname = "";
  }

  /**
   * Delete all records of all record types ("Empty Records"),
   * keeping the system configuration (entity types, dropdown options,
   * permissions, reports, templates and site settings) unchanged.
   *
   * The database's own index documents are kept as well: the app keeps running
   * after this action and only recreates its indices on the next startup.
   */
  private async deleteAllRecords(
    profilesToKeep: UserProfilesToKeep,
  ): Promise<void> {
    // log before deleting for traceability of possible data loss
    Logging.warn("Emptying records: deleting all records of all record types");

    const deletedDocs = await this.db.removeAll((doc) =>
      this.isRecordDocument(
        doc._id,
        profilesToKeep.linkedProfileIds,
        !profilesToKeep.accountsVerified,
      ),
    );
    Logging.debug("Emptied records", { deletedDocs });
  }

  /**
   * Delete everything ("Reset System"): all records as well as the complete
   * system configuration (entity types, dropdown options, permissions, reports,
   * templates and site settings), leaving a system that has to be set up from scratch.
   *
   * Only the profile of the user performing the reset is kept, so that they can
   * keep working with their own account while setting the system up anew.
   * The profiles of all other users are deleted (their login accounts are not touched).
   *
   * The database's own index documents are deleted as well;
   * they are recreated when the app reloads right after this.
   */
  private async deleteEverything(): Promise<void> {
    // log before deleting for traceability of possible data loss
    Logging.warn(
      "Resetting system: deleting all records and the system configuration",
    );

    const ownProfileId = this.sessionInfo?.value?.entityId;

    const deletedDocs = await this.db.removeAll(
      (doc) => doc._id !== ownProfileId,
    );
    Logging.debug("Reset system", { deletedDocs });
  }

  /**
   * Look up which records must be kept by {@link deleteAllRecords}
   * because a login account is linked to them.
   *
   * This runs before the confirmation dialog,
   * so that the user can be told upfront what exactly will be kept.
   */
  private async getUserProfilesToKeep(): Promise<UserProfilesToKeep> {
    try {
      const accounts = await firstValueFrom(
        this.userAdminService.getAllUsers(),
      );
      const linkedProfileIds = new Set(
        accounts.map((account) => account.userEntityId).filter(Boolean),
      );
      return { linkedProfileIds, accountsVerified: true };
    } catch (err) {
      // a missing account_manager role is an expected, common case and not worth a warning
      if (err instanceof UserAdminApiError && err.status === 403) {
        Logging.debug(
          "Could not look up user accounts before deleting records",
          {
            error: err,
          },
        );
      } else {
        Logging.warn(
          "Could not look up user accounts before deleting records",
          {
            error: err,
          },
        );
      }
      return { linkedProfileIds: new Set(), accountsVerified: false };
    }
  }

  /**
   * These bulk deletions must only run online, so that they take effect for everybody
   * immediately. Inform the user and abort the action otherwise.
   */
  private async ensureDeletionPossible(): Promise<boolean> {
    // offline the deletions would sit in the local database while other users keep
    // working on records that are already deleted here, producing conflicts once
    // the deletions are finally synced
    if (this.navigator?.onLine ?? true) {
      return true;
    }

    await this.confirmationDialog.getConfirmation(
      $localize`:Delete records offline title:Not available offline`,
      $localize`:Delete records offline text:This action requires an internet connection, so that it takes effect for all users immediately. Deleting the records offline would let others keep working on records that no longer exist here, causing conflicts once your changes are synchronised. Please connect to the internet and try again.`,
      OkButton,
      false,
    );
    return false;
  }

  /**
   * Describe for the user which records are kept because a login account is linked to them.
   */
  private getKeptProfilesDescription(profilesToKeep: UserProfilesToKeep) {
    if (!profilesToKeep.accountsVerified) {
      return $localize`:Kept user profiles, accounts unknown:The linked login accounts could not be checked, so for safety all records of the record types that can have a login account (usually "User") are kept.`;
    }

    return $localize`:Kept user profiles:Only those records that a login account is linked to are kept, so that users keep their profile.`;
  }

  /**
   * Whether the given document holds user data ("a record")
   * as opposed to system configuration or internal database documents.
   *
   * @param docId the document to check
   * @param profileIdsToKeep ids of user profile records that must not be deleted
   * @param keepAllPotentialProfiles whether to additionally keep every record of a type
   *        that can have user accounts, because it is unknown which of them actually have one
   */
  private isRecordDocument(
    docId: string,
    profileIdsToKeep: Set<string>,
    keepAllPotentialProfiles: boolean,
  ): boolean {
    // documents used by the database itself (e.g. "_design/..." indices) are not records
    if (docId.startsWith("_")) {
      return false;
    }

    if (profileIdsToKeep.has(docId)) {
      return false;
    }

    const entityType = this.getEntityType(docId);
    if (keepAllPotentialProfiles && entityType?.enableUserAccounts) {
      return false;
    }
    if (
      SystemResetService.DATA_HISTORY_TYPES.includes(entityType?.ENTITY_TYPE)
    ) {
      return true;
    }

    // types that are not (or no longer) registered are leftover records, not config
    return !entityType?.isInternalEntity;
  }

  private getEntityType(docId: string): EntityConstructor | undefined {
    const type = Entity.extractTypeFromId(docId);
    return this.entityRegistry.has(type)
      ? this.entityRegistry.get(type)
      : undefined;
  }
}
