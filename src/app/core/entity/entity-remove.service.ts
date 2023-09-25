import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Entity } from "./model/entity";
import { race } from "rxjs";
import { map } from "rxjs/operators";
import { getUrlWithoutParams } from "../../utils/utils";
import { Router } from "@angular/router";

/**
 * All possible results when removing an entity
 */
export enum RemoveResult {
  /**
   * The user cancelled the action
   */
  CANCELLED,
  /**
   * The entity was successfully removed
   */
  REMOVED,
  /**
   * The user has undone the action and the entity
   * now exists again
   */
  UNDONE,
}

/**
 * Additional options that can be (partly) specified
 * for the several titles
 */
export interface RemoveEntityTextOptions {
  dialogTitle?: string;
  dialogText?: string;
  deletedEntityInformation?: string;
}

/**
 * A service that can triggers a user flow to safely remove an entity,
 * including a confirmation dialog.
 */
@Injectable({
  providedIn: "root",
})
export class EntityRemoveService {
  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  /**
   * Shows a confirmation dialog to the user
   * and removes the entity if the user confirms.
   *
   * This also triggers a toast message, enabling the user to undo the action.
   *
   * @param entity The entity to remove
   * @param textOptions Options that you can specify to override the default options.
   * You can only specify some of the options, the options that you don't specify will then be
   * the default ones.
   * @param navigate whether upon delete the app will navigate back
   */
  async remove<E extends Entity>(
    entity: E,
    navigate: boolean = false,
    textOptions?: RemoveEntityTextOptions,
  ): Promise<boolean> {
    const confirmation = await this.showDeleteConfirmationDialog(
      textOptions,
      entity,
    );
    if (!confirmation) {
      return false;
    }

    await this.entityMapper.remove(entity);

    let currentUrl;
    if (navigate) {
      currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      await this.router.navigate([parentUrl]);
    }

    this.showSnackbarConfirmation(textOptions, entity, currentUrl);

    return true;
  }

  private async showDeleteConfirmationDialog(
    textOptions: RemoveEntityTextOptions,
    entity: Entity,
  ) {
    const dialogTitle =
      textOptions?.dialogTitle || $localize`:Delete confirmation title:Delete?`;
    const dialogText =
      textOptions?.dialogText ||
      $localize`:Delete confirmation text:Are you sure you want to delete this ${entity.getType()} record?`;

    return this.confirmationDialog.getConfirmation(dialogTitle, dialogText);
  }

  private showSnackbarConfirmation(
    textOptions: RemoveEntityTextOptions,
    entity: Entity,
    currentUrl?: string,
  ) {
    const snackBarTitle =
      textOptions?.deletedEntityInformation ||
      $localize`:Deleted Entity information:Deleted Entity ${entity.toString()}`;

    const snackBarRef = this.snackBar.open(
      snackBarTitle,
      $localize`:Undo deleting an entity:Undo`,
      {
        duration: 8000,
      },
    );
    race(
      snackBarRef.onAction().pipe(map(() => true)),
      snackBarRef.afterDismissed().pipe(map(() => false)),
    ).subscribe(async (next) => {
      if (next) {
        await this.entityMapper.save(entity, true);
        if (currentUrl) {
          await this.router.navigate([currentUrl]);
        }
      }
    });
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
    for (const [key, schema] of entity.getSchema().entries()) {
      if (schema.anonymize !== "retain") {
        delete entity[key];
      }
    }

    await this.entityMapper.save(entity);
  }
}
