import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "./entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Entity } from "./model/entity";
import { Observable, race, Subject } from "rxjs";
import { map } from "rxjs/operators";

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
 * A service that can be used to safely remove an entity
 * which includes:
 * <ul>
 *  <li> Displaying a confirmation dialog and asking the user whether or not he
 *  wants to delete the entity
 *  <li> Removing the entity in the `EntityMapperService` (if he chose so)
 *  <li> Opening a snack bar to allow the user to undo the action
 * </ul>
 */
@Injectable({
  providedIn: "root",
})
export class EntityRemoveService {
  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private snackBar: MatSnackBar,
  ) {}

  /**
   * Removes the entity after displaying a confirmation dialog.
   * The returned observable will emit once or twice, depending on how the
   * user chose.
   * <ul>
   *  <li> When the user chose 'no', the subject will emit once with
   *  {@link RemoveResult.CANCELLED CANCELLED}.
   *  <li> When the user chose 'yes', the subject will emit with the result
   *  {@link RemoveResult.REMOVED REMOVED}. If the user doesn't undo, the subject will complete
   *  once the snack bar has disappeared. If the user chose undo, the subject will
   *  emit with the result {@link RemoveResult.UNDONE UNDONE}.
   * </ul>
   * <br>
   * This method takes care of saving the entity as if one were to call the resp. methods
   * of the `EntityMapperService`. It also restores the entity when the user chose to
   * undo. All of the aforementioned results will only be called if the actions have already
   * been taken.
   * <br>
   * You do not need to unsubscribe from this method as the observable will be closed on all
   * possible paths.
   * @param entity The entity to remove
   * @param textOptions Options that you can specify to override the default options.
   * You can only specify some of the options, the options that you don't specify will then be
   * the default ones.
   */
  remove<E extends Entity>(
    entity: E,
    textOptions?: RemoveEntityTextOptions,
  ): Observable<RemoveResult> {
    const subject = new Subject<RemoveResult>();
    const dialogTitle =
      textOptions?.dialogTitle || $localize`:Delete confirmation title:Delete?`;
    const dialogText =
      textOptions?.dialogText ||
      $localize`:Delete confirmation text:Are you sure you want to delete this ${entity.getType()}?`;
    this.confirmationDialog
      .getConfirmation(dialogTitle, dialogText)
      .then((confirmed) => {
        if (confirmed) {
          const snackBarTitle =
            textOptions?.deletedEntityInformation ||
            $localize`:Deleted Entity information:Deleted Entity ${entity.toString()}`;
          this.removeEntityAndOpenSnackBar(entity, snackBarTitle, subject);
        } else {
          subject.next(RemoveResult.CANCELLED);
          subject.complete();
        }
      });
    return subject.asObservable();
  }

  /**
   * Decoupled from the main method for readability
   * @param entity The entity to remove
   * @param snackBarTitle The title of the snack-bar
   * @param resultSender The sender that informs when the user
   * has clicked 'undo' and that completes once no undo is possible
   * @private
   */
  private async removeEntityAndOpenSnackBar(
    entity: Entity,
    snackBarTitle: string,
    resultSender: Subject<RemoveResult>,
  ) {
    await this.entityMapper.remove(entity);
    resultSender.next(RemoveResult.REMOVED);
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
        resultSender.next(RemoveResult.UNDONE);
      }
      resultSender.complete();
    });
  }
}
