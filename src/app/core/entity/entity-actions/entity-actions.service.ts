import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { getUrlWithoutParams } from "../../../utils/utils";
import { EntityDeleteService } from "./entity-delete.service";
import { EntityAnonymizeService } from "./entity-anonymize.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

/**
 * A service that can triggers a user flow for entity actions (e.g. to safely remove or anonymize an entity),
 * including a confirmation dialog.
 */
@Injectable({
  providedIn: "root",
})
export class EntityActionsService {
  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private router: Router,
    private entityMapper: EntityMapperService,
    private entityDelete: EntityDeleteService,
    private entityAnonymize: EntityAnonymizeService,
  ) {}

  showSnackbarConfirmationWithUndo(
    message: string,
    previousEntitiesForUndo: Entity[],
    navigateBackToUrl?: string,
  ) {
    const snackBarRef = this.snackBar.open(
      message,
      $localize`:Undo an entity action:Undo`,
      {
        duration: 8000,
      },
    );

    // Undo Action
    snackBarRef.onAction().subscribe(async () => {
      const undoProgressRef = this.confirmationDialog.showProgressDialog(
        $localize`:Undo entity action progress dialog: Reverting changes ...`,
      );
      await this.entityMapper.saveAll(previousEntitiesForUndo, true);
      undoProgressRef.close();

      if (navigateBackToUrl) {
        await this.router.navigate([navigateBackToUrl]);
      }
    });
  }

  /**
   * Shows a confirmation dialog to the user
   * and removes the entity if the user confirms.
   *
   * This also triggers a toast message, enabling the user to undo the action.
   *
   * @param entity The entity to remove
   * @param navigate whether upon delete the app will navigate back
   */
  async delete<E extends Entity>(
    entity: E,
    navigate: boolean = false,
  ): Promise<boolean> {
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Delete confirmation title:Delete?`,
        $localize`:Delete confirmation dialog:
        This will remove the data permanently as if it never existed. This cannot be undone. Statistical reports (also for past time periods) will change and not include this record anymore.\n
        If you have not just created this record accidentally, deleting this is probably not what you want to do. If the record represents something that actually happened in your work, consider to use "anonymize" or just "archive" instead, so that you will not lose your documentation for reports.\n
        Are you sure you want to delete this ${
          entity.getConstructor().label
        } record?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    const result = await this.entityDelete.deleteEntity(entity);
    progressDialogRef.close();

    if (result.potentiallyRetainingPII.length > 0) {
      await this.confirmationDialog.getConfirmation(
        $localize`:post-delete related PII warning title:Related records may still contain personal data`,
        $localize`:post-delete related PII warning dialog:Some related records (e.g. notes) may still contain personal data in their text. We have automatically deleted all records that are linked to ONLY this ${
          entity.getConstructor().label
        }.
        However, there are some records that are linked to multiple records. We have not deleted these, so that you will not lose relevant data. Please review them manually to ensure all sensitive information is removed, if required (e.g. by looking through the linked notes and editing a note's text).`,
        OkButton,
      );
    }

    let currentUrl: string;
    if (navigate) {
      currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      await this.router.navigate([parentUrl]);
    }

    this.showSnackbarConfirmationWithUndo(
      $localize`:Entity action confirmation message:${
        result.originalEntitiesBeforeChange[0].getConstructor().label
      } "${result.originalEntitiesBeforeChange[0].toString()}" deleted`,
      result.originalEntitiesBeforeChange,
      currentUrl,
    );
    return true;
  }

  /**
   * Anonymize the given entity,
   * removing properties that are not explicitly configured in the schema to be retained.
   *
   * This triggers UX interactions like confirmation request dialog and snackbar message as well.
   *
   * @param entity
   */
  async anonymize<E extends Entity>(entity: E) {
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Anonymize confirmation dialog:Anonymize?`,
        $localize`:Anonymize confirmation dialog:
        This will remove all personal information (PII) permanently and keep only a basic record for statistical reports. Details that are removed during anonymization cannot be recovered.\n
        If this ${
          entity.getConstructor().label
        } has only become inactive and you want to keep all details about the record, consider to use "archive" instead.\n
        Are you sure you want to anonymize this record?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    const result = await this.entityAnonymize.anonymizeEntity(entity);
    progressDialogRef.close();

    if (result.potentiallyRetainingPII.length > 0) {
      await this.confirmationDialog.getConfirmation(
        $localize`:post-anonymize related PII warning title:Related records may still contain personal data`,
        $localize`:post-anonymize related PII warning dialog:Some related records (e.g. notes) may still contain personal data in their text. We have automatically anonymized all records that are linked to ONLY this ${
          entity.getConstructor().label
        }.
        However, there are some records that are linked to multiple records. We have not anonymized these, so that you will not lose relevant data. Please review them manually to ensure all sensitive information is removed (e.g. by looking through the linked notes and editing a note's text).`,
        OkButton,
      );
    }

    this.showSnackbarConfirmationWithUndo(
      $localize`:Entity action confirmation message:${
        result.originalEntitiesBeforeChange[0].getConstructor().label
      } "${result.originalEntitiesBeforeChange[0].toString()}" anonymized`,
      result.originalEntitiesBeforeChange,
    );
    return true;
  }

  /**
   * Mark the given entity as inactive.
   * @param entity
   */
  async archive<E extends Entity>(entity: E) {
    const originalEntity = entity.copy();
    entity.inactive = true;

    await this.entityMapper.save(entity);

    this.showSnackbarConfirmationWithUndo(
      $localize`:Entity action confirmation message:${
        originalEntity.getConstructor().label
      } "${originalEntity.toString()}" archived`,
      [originalEntity],
    );
    return true;
  }
  /**
   * Undo the archive action on the given entity.
   * @param entity
   */
  async undoArchive<E extends Entity>(entity: E) {
    const originalEntity = entity.copy();
    entity.inactive = false;
    await this.entityMapper.save(entity);

    this.showSnackbarConfirmationWithUndo(
      $localize`:Entity action confirmation message:${
        originalEntity.getConstructor().label
      } "${originalEntity.toString()}" reactivated`,
      [originalEntity],
    );
    return true;
  }
}
