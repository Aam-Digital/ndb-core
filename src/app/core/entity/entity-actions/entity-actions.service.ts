import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { getUrlWithoutParams } from "../../../utils/utils";
import { EntityDeleteService } from "./entity-delete.service";
import { EntityAnonymizeService } from "./entity-anonymize.service";

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

  private showSnackbarConfirmation(
    entity: Entity,
    action: string,
    previousEntitiesForUndo: Entity[],
    navigateBackToUrl?: string,
  ) {
    const snackBarTitle = $localize`:Entity action confirmation message:${
      entity.getConstructor().label
    } "${entity.toString()}" ${action}`;

    const snackBarRef = this.snackBar.open(
      snackBarTitle,
      $localize`:Undo an entity action:Undo`,
      {
        duration: 8000,
      },
    );

    // Undo Action
    snackBarRef.onAction().subscribe(async () => {
      await this.entityMapper.saveAll(previousEntitiesForUndo, true);
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

    const affectedEntitiesBeforeAction =
      await this.entityDelete.deleteEntity(entity);

    let currentUrl: string;
    if (navigate) {
      currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      await this.router.navigate([parentUrl]);
    }

    this.showSnackbarConfirmation(
      affectedEntitiesBeforeAction[0],
      $localize`:Entity action confirmation message verb:Deleted`,
      affectedEntitiesBeforeAction,
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

    const affectedEntitiesBeforeAction =
      await this.entityAnonymize.anonymizeEntity(entity);

    this.showSnackbarConfirmation(
      affectedEntitiesBeforeAction[0],
      $localize`:Entity action confirmation message verb:Anonymized`,
      affectedEntitiesBeforeAction,
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

    this.showSnackbarConfirmation(
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

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Reactivated`,
      [originalEntity],
    );
    return true;
  }
}
