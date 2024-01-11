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
import { en } from "@faker-js/faker";
import { CascadingActionResult } from "./cascading-entity-action";

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
    entityParam: Entity | Entity[],
    action: string,
    previousEntitiesForUndo: Entity[],
    navigateBackToUrl?: string,
  ) {
    let snackBarTitle = "";
    if (Array.isArray(entityParam)) {
      if (entityParam.length > 1) {
        snackBarTitle = $localize`:Entity action confirmation message:${
          entityParam.length
        } ${entityParam[0].getConstructor().labelPlural} ${action}`;
      } else {
        snackBarTitle = $localize`:Entity action confirmation message:${
          entityParam[0].getConstructor().label
        } "${entityParam.toString()}" ${action}`;
      }
    } else {
      snackBarTitle = $localize`:Entity action confirmation message:${
        entityParam.getConstructor().label
      } "${entityParam.toString()}" ${action}`;
    }

    const snackBarRef = this.snackBar.open(
      snackBarTitle,
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
   * @param entityParam The entity to remove
   * @param navigate whether upon delete the app will navigate back
   */
  async delete<E extends Entity>(
    entityParam: E | E[],
    navigate: boolean = false,
  ): Promise<boolean> {
    let textForDeleteEntity = "";
    let concernsSeveralEntities = false;
    if (Array.isArray(entityParam)) {
      if (entityParam.length > 1) {
        textForDeleteEntity =
          $localize`:Demonstrative pronoun plural:these` +
          " " +
          entityParam.length +
          " " +
          entityParam[0].getConstructor().labelPlural;
        concernsSeveralEntities = true;
      } else {
        textForDeleteEntity =
          $localize`:Definite article singular:the` +
          " " +
          entityParam[0].getConstructor().label +
          ' "' +
          entityParam[0].toString() +
          '"';
      }
    } else if (!Array.isArray(entityParam)) {
      textForDeleteEntity =
        $localize`:Definite article singular:the` +
        " " +
        entityParam.getConstructor().label +
        ' "' +
        entityParam.toString() +
        '"';
    }

    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Delete confirmation title:Delete?`,
        $localize`:Delete confirmation dialog:
        This will remove the data permanently as if it never existed. This cannot be undone. Statistical reports (also for past time periods) will change and not include this record anymore.\n
        If you have not just created this record accidentally, deleting this is probably not what you want to do. If the record represents something that actually happened in your work, consider to use "anonymize" or just "archive" instead, so that you will not lose your documentation for reports.\n
        Are you sure you want to delete ${textForDeleteEntity}?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    let result = new CascadingActionResult();
    if (Array.isArray(entityParam)) {
      for (let entity of entityParam) {
        console.log("Peter deleting entity:", entity);
        result.mergeResults(await this.entityDelete.deleteEntity(entity));
      }
    } else {
      console.log("Peter deleting single entity:", entityParam);
      result = await this.entityDelete.deleteEntity(entityParam);
    }
    progressDialogRef.close();

    if (result.potentiallyRetainingPII.length > 0) {
      await this.confirmationDialog.getConfirmation(
        $localize`:post-delete related PII warning title:Related records may still contain personal data`,
        $localize`:post-delete related PII warning dialog:Some related records (e.g. notes) may still contain personal data in their text. We have automatically deleted all records that are linked to ONLY ${textForDeleteEntity}.
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
      concernsSeveralEntities
        ? entityParam
        : result.originalEntitiesBeforeChange[0],
      $localize`:Entity action confirmation message verb:Deleted`,
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
   * @param entityParam
   */
  async anonymize<E extends Entity>(entityParam: E | E[]) {
    let textForAnonymizeEntity = "";
    let concernsSeveralEntities = false;
    if (Array.isArray(entityParam)) {
      if (entityParam.length > 1) {
        textForAnonymizeEntity =
          $localize`:Demonstrative pronoun plural:these` +
          " " +
          entityParam.length +
          " " +
          entityParam[0].getConstructor().labelPlural;
        concernsSeveralEntities = true;
      } else {
        textForAnonymizeEntity =
          $localize`:Definite article singular:the` +
          " " +
          entityParam[0].getConstructor().label +
          ' "' +
          entityParam[0].toString() +
          '"';
      }
    } else if (!Array.isArray(entityParam)) {
      textForAnonymizeEntity =
        $localize`:Definite article singular:the` +
        " " +
        entityParam.getConstructor().label +
        ' "' +
        entityParam.toString() +
        '"';
    }
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Anonymize confirmation dialog:Anonymize?`,
        $localize`:Anonymize confirmation dialog:
        This will remove all personal information (PII) permanently and keep only a basic record for statistical reports. Details that are removed during anonymization cannot be recovered.\n
        If ${textForAnonymizeEntity} has only become inactive and you want to keep all details, consider to use "archive" instead.\n
        Are you sure you want to anonymize this record?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    let result = new CascadingActionResult();
    if (Array.isArray(entityParam)) {
      for (let entity of entityParam) {
        console.log("Peter anonymizing entity:", entity);
        result.mergeResults(await this.entityAnonymize.anonymizeEntity(entity));
      }
    } else {
      console.log("Peter deleting single entity:", entityParam);
      result = await this.entityAnonymize.anonymizeEntity(entityParam);
    }
    progressDialogRef.close();

    if (result.potentiallyRetainingPII.length > 0) {
      await this.confirmationDialog.getConfirmation(
        $localize`:post-anonymize related PII warning title:Related records may still contain personal data`,
        $localize`:post-anonymize related PII warning dialog:Some related records (e.g. notes) may still contain personal data in their text. We have automatically anonymized all records that are linked to ONLY ${textForAnonymizeEntity}.
        However, there are some records that are linked to multiple records. We have not anonymized these, so that you will not lose relevant data. Please review them manually to ensure all sensitive information is removed (e.g. by looking through the linked notes and editing a note's text).`,
        OkButton,
      );
    }

    this.showSnackbarConfirmationWithUndo(
      concernsSeveralEntities
        ? entityParam
        : result.originalEntitiesBeforeChange[0],
      $localize`:Entity action confirmation message verb:Anonymized`,
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
      originalEntity,
      $localize`:Entity action confirmation message verb:Archived`,
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
      originalEntity,
      $localize`:Entity action confirmation message verb:Reactivated`,
      [originalEntity],
    );
    return true;
  }
}
