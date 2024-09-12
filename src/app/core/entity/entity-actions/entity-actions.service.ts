import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../model/entity";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { getUrlWithoutParams } from "../../../utils/utils";
import { EntityDeleteService } from "./entity-delete.service";
import { EntityAnonymizeService } from "./entity-anonymize.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { CascadingActionResult } from "./cascading-entity-action";
import { EntityActionsMenuService } from "../../entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityEditService } from "./entity-edit.service";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { EntityBulkEditComponent } from "./entity-bulk-edit/entity-bulk-edit.component";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";

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
    private matDialog: MatDialog,
    private entityMapper: EntityMapperService,
    private entityDelete: EntityDeleteService,
    private entityEdit: EntityEditService,
    private entityAnonymize: EntityAnonymizeService,
    entityActionsMenuService: EntityActionsMenuService,
  ) {
    entityActionsMenuService.registerActions([
      {
        action: "archive",
        execute: (e) => this.archive(e),
        permission: "update",
        icon: "box-archive",
        label: $localize`:entity context menu:Archive`,
        tooltip: $localize`:entity context menu tooltip:Mark the record as inactive, hiding it from lists by default while keeping the data.`,
        primaryAction: true,
      },
      {
        action: "anonymize",
        execute: (e) => this.anonymize(e),
        permission: "update",
        icon: "user-secret",
        label: $localize`:entity context menu:Anonymize`,
        tooltip: $localize`:entity context menu tooltip:Remove all personal data and keep an archived basic record for statistical reporting.`,
      },
      {
        action: "delete",
        execute: (e, nav) => this.delete(e, nav),
        permission: "delete",
        icon: "trash",
        label: $localize`:entity context menu:Delete`,
        tooltip: $localize`:entity context menu tooltip:Remove the record completely from the database.`,
      },
      {
        action: "edit",
        execute: (e, nav) => this.edit(e, nav),
        permission: "edit",
        icon: "edit",
        label: $localize`:entity context menu:Edit`,
        tooltip: $localize`:entity context menu tooltip:Update the record.`,
      },
    ]);
  }

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
   * @param entityParam The entity to remove
   * @param navigate whether upon delete the app will navigate back
   */
  async delete<E extends Entity>(
    entityParam: E | E[],
    navigate: boolean = false,
  ): Promise<boolean> {
    let textForDeleteEntity = "";
    let entities = Array.isArray(entityParam) ? entityParam : [entityParam];
    if (entities.length > 1) {
      textForDeleteEntity =
        $localize`:Demonstrative pronoun plural:these` +
        " " +
        entities.length +
        " " +
        entities[0].getConstructor().labelPlural;
    } else {
      textForDeleteEntity =
        $localize`:Definite article singular:the` +
        " " +
        entities[0].getConstructor().label +
        ' "' +
        entities[0].toString() +
        '"';
    }

    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Delete confirmation title:Delete?`,
        $localize`:Delete confirmation dialog:
        This will remove the data permanently as if it never existed. This cannot be undone. Statistical reports (also for past time periods) will change and not include this record anymore.\n
        If you have not just created a record accidentally, deleting this is probably not what you want to do. If a record represents something that actually happened in your work, consider to use "anonymize" or just "archive" instead, so that you will not lose your documentation for reports.\n
        Are you sure you want to delete ${textForDeleteEntity}?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    let result = new CascadingActionResult();

    for (let entity of entities) {
      result.mergeResults(await this.entityDelete.deleteEntity(entity, true));
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
      this.generateMessageForConfirmationWithUndo(
        entities.length > 0
          ? entities
          : [result.originalEntitiesBeforeChange[0]],
        $localize`:Entity action confirmation message verb:deleted`,
      ),
      result.originalEntitiesBeforeChange,
      currentUrl,
    );
    return true;
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
  async edit<E extends Entity>(
    entityParam: E | E[],
    navigate: boolean = false,
    entityConstructor?: EntityConstructor,
  ): Promise<boolean> {
    let textForEditEntity = "";
    let entities = Array.isArray(entityParam) ? entityParam : [entityParam];
    if (entities.length > 1) {
      textForEditEntity =
        $localize`:Demonstrative pronoun plural:these` +
        " " +
        entities.length +
        " " +
        entities[0].getConstructor().labelPlural;
    } else {
      textForEditEntity =
        $localize`:Definite article singular:the` +
        " " +
        entities[0].getConstructor().label +
        ' "' +
        entities[0].toString() +
        '"';
    }
    let result = new CascadingActionResult();

    if (
      await this.confirmationDialog.getConfirmation(
        $localize`:Edit confirmation title:Edit?`,
        $localize`:Edit confirmation dialog:
        You are about to modify the selected records. This action will apply changes across multiple entries and cannot be undone. Please ensure that the fields you are updating reflect the correct information for all selected records.\n
        If you are unsure about making changes across all these records, consider applying edits individually or reviewing your selection carefully before proceeding.\n
        Are you sure you want to Edit ${textForEditEntity}?`,
      )
    ) {
      const dialogRef = this.matDialog.open(EntityBulkEditComponent, {
        width: "30%",
        maxHeight: "90vh",
        data: { entityConstructor, selectedRow: entities },
      });
      const results = await lastValueFrom(dialogRef.afterClosed());
      if (results) {
        const result = await this.entityEdit.editEntity(results, entityParam);
        this.showSnackbarConfirmationWithUndo(
          this.generateMessageForConfirmationWithUndo(
            entities,
            $localize`:Entity action confirmation message verb:edited`,
          ),
          result.originalEntities,
        );
        return true;
      }
    }
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
    let entities = Array.isArray(entityParam) ? entityParam : [entityParam];
    let textForAnonymizeEntity = "";

    if (entities.length > 1) {
      textForAnonymizeEntity =
        $localize`:Demonstrative pronoun plural:these` +
        " " +
        entities.length +
        " " +
        entities[0].getConstructor().labelPlural;
    } else {
      textForAnonymizeEntity =
        $localize`:Definite article singular:the` +
        " " +
        entities[0].getConstructor().label +
        ' "' +
        entities[0].toString() +
        '"';
    }

    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Anonymize confirmation dialog:Anonymize?`,
        $localize`:Anonymize confirmation dialog:
        This will remove all personal information (PII) permanently and keep only a basic record for statistical reports. Details that are removed during anonymization cannot be recovered.\n
        If a record has only become inactive and you want to keep all details, consider to use "archive" instead.\n
        Are you sure you want to anonymize ${textForAnonymizeEntity}?`,
      ))
    ) {
      return false;
    }

    const progressDialogRef = this.confirmationDialog.showProgressDialog(
      $localize`:Entity action progress dialog:Processing ...`,
    );
    let result = new CascadingActionResult();
    for (let entity of entities) {
      result.mergeResults(await this.entityAnonymize.anonymizeEntity(entity));
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
      this.generateMessageForConfirmationWithUndo(
        entities.length > 0
          ? entities
          : [result.originalEntitiesBeforeChange[0]],
        $localize`:Entity action confirmation message verb:anonymized`,
      ),
      result.originalEntitiesBeforeChange,
    );
    return true;
  }

  /**
   * Mark the given entity as inactive.
   * @param entity
   */
  async archive<E extends Entity>(entityParam: E | E[]) {
    let originalEntities: E[] = Array.isArray(entityParam)
      ? entityParam
      : [entityParam];
    const newEntities: E[] = originalEntities.map((e) => e.copy());
    newEntities.forEach(async (e) => {
      e.inactive = true;
      console.log(e, "eejejnejejejhejh");
      await this.entityMapper.save(e);
    });

    this.showSnackbarConfirmationWithUndo(
      this.generateMessageForConfirmationWithUndo(
        newEntities,
        $localize`:Entity action confirmation message verb:archived`,
      ),
      originalEntities,
    );
    return true;
  }
  /**
   * Undo the archive action on the given entity or entities.
   * @param entity
   */
  async undoArchive<E extends Entity>(entityParam: E | E[]) {
    let newEntities: E[] = Array.isArray(entityParam)
      ? entityParam
      : [entityParam];
    const originalEntities: E[] = newEntities.map((e) => e.copy());
    newEntities.forEach(async (e) => {
      e.inactive = false;
      await this.entityMapper.save(e);
    });

    this.showSnackbarConfirmationWithUndo(
      this.generateMessageForConfirmationWithUndo(
        newEntities,
        $localize`:Entity action confirmation message verb:reactivated`,
      ),
      originalEntities,
    );
    return true;
  }

  private generateMessageForConfirmationWithUndo(
    entities: Entity[],
    action: string,
  ): string {
    if (entities.length > 1) {
      return $localize`:Entity action confirmation message:${entities.length} ${
        entities[0].getConstructor().labelPlural
      } ${action}`;
    } else {
      return $localize`:Entity action confirmation message:${
        entities[0].getConstructor().label
      } "${entities.toString()}" ${action}`;
    }
  }
}
