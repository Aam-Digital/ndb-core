import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "./cascading-entity-action";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";

/**
 * Safely delete an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
 */
@Injectable({
  providedIn: "root",
})
export class EntityDeleteService extends CascadingEntityAction {
  private userAdminService = inject(UserAdminService);
  private confirmationDialog = inject(ConfirmationDialogService);

  /**
   * The actual delete action without user interactions.
   *
   * Returns an array of all affected entities (including the given entity) in their state before the action
   * to support an undo action.
   *
   * @param entity
   * @param showKeycloakWarning if keycloak deleteUser request fails, a popup warning is shown to the user
   * @private
   */
  async deleteEntity(
    entity: Entity,
    showKeycloakWarning = false,
  ): Promise<CascadingActionResult> {
    if (entity.getConstructor()?.enableUserAccounts) {
      this.userAdminService.deleteUser(entity.getId()).subscribe({
        next: () => {},
        error: () => {
          if (showKeycloakWarning) {
            this.confirmationDialog.getConfirmation(
              $localize`:delete account in keycloak related error title:Keycloak User could not be deleted`,
              $localize`:delete account in keycloak related error dialog:User Account could not be deleted in Keycloak. Please delete user manually in Keycloak.`,
              OkButton,
            );
          }
        },
      });
    }

    const cascadeResult = await this.cascadeActionToRelatedEntities(
      entity,
      (e) => this.deleteEntity(e),
      (e, refField, entity) =>
        this.removeReferenceFromEntity(e, refField, entity),
    );

    const originalEntity = entity.copy();
    await this.entityMapper.remove(entity);

    return new CascadingActionResult([originalEntity]).mergeResults(
      cascadeResult,
    );
  }

  /**
   * Change and save the entity, removing referenced ids of the given referenced entity.
   *
   * Returns an array of the affected entities (which here is only the given entity) in the state before the action
   * to support an undo action.
   *
   * @param relatedEntityWithReference
   * @param refField
   * @param referencedEntity
   * @private
   */
  private async removeReferenceFromEntity(
    relatedEntityWithReference: Entity,
    refField: string,
    referencedEntity: Entity,
  ): Promise<CascadingActionResult> {
    const originalEntity = relatedEntityWithReference.copy();

    if (Array.isArray(relatedEntityWithReference[refField])) {
      relatedEntityWithReference[refField] = relatedEntityWithReference[
        refField
      ].filter((id) => id !== referencedEntity.getId());
    } else {
      delete relatedEntityWithReference[refField];
    }

    await this.entityMapper.save(relatedEntityWithReference);

    return new CascadingActionResult(
      [originalEntity],
      relatedEntityWithReference.getConstructor().hasPII
        ? [relatedEntityWithReference]
        : [],
    );
  }
}
