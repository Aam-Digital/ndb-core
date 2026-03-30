import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "./cascading-entity-action";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";
import { UserAccount } from "../../user/user-admin-service/user-account";
import { SessionSubject } from "../../session/auth/session-info";
import { itemReferencesId } from "../entity-mapper/entity-relations.service";
import { firstValueFrom } from "rxjs";

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
  private sessionInfo = inject(SessionSubject);

  /**
   * The actual delete action without user interactions.
   *
   * Returns an array of all affected entities (including the given entity) in their state before the action
   * to support an undo action.
   *
   * @param entity
   */
  async deleteEntity(entity: Entity): Promise<CascadingActionResult> {
    if (entity.getConstructor()?.enableUserAccounts) {
      await this.handleUserAccountDeletion(entity);
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

  private async handleUserAccountDeletion(entity: Entity): Promise<void> {
    let linkedAccount: UserAccount | null;
    try {
      linkedAccount = await firstValueFrom(
        this.userAdminService.getUser(entity.getId()),
      );
    } catch {
      // API inaccessible (e.g. 403 — no permission to query accounts) — skip silently
      return;
    }

    if (!linkedAccount) {
      return;
    }

    if (
      !this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      )
    ) {
      // Cannot manage accounts without admin role — skip silently
      return;
    }

    const sessionEntityId = this.sessionInfo.value?.entityId;
    const isOwnAccount =
      sessionEntityId !== undefined &&
      (sessionEntityId === entity.getId() ||
        sessionEntityId === entity.getId(true));

    if (isOwnAccount) {
      await this.confirmationDialog.getConfirmation(
        $localize`:self-deletion warning title:Cannot delete own account`,
        $localize`:self-deletion warning dialog:You cannot delete your own account. Please ask another admin to remove your account if needed.`,
        OkButton,
      );
      return;
    }

    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`:delete account confirmation title:Also delete linked user account?`,
      $localize`:delete account confirmation dialog:This entity has a linked user account. Do you also want to permanently delete the user account? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.userAdminService.deleteUser(entity.getId()));
    } catch {
      await this.confirmationDialog.getConfirmation(
        $localize`:delete account in keycloak related error title:Keycloak User could not be deleted`,
        $localize`:delete account in keycloak related error dialog:User Account could not be deleted in Keycloak. Please delete user manually in Keycloak.`,
        OkButton,
      );
    }
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
    const fieldSchema = relatedEntityWithReference
      .getConstructor()
      .schema.get(refField);

    if (Array.isArray(relatedEntityWithReference[refField])) {
      relatedEntityWithReference[refField] = relatedEntityWithReference[
        refField
      ].filter(
        (item) =>
          !itemReferencesId(item, referencedEntity.getId(), fieldSchema),
      );
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
