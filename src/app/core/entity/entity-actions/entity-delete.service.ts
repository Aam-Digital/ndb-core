import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "./cascading-entity-action";
import {
  OkButton,
  YesNoCancelButtons,
} from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import {
  UserAdminApiError,
  UserAdminService,
} from "../../user/user-admin-service/user-admin.service";
import { UserAccount } from "../../user/user-admin-service/user-account";
import { SessionSubject } from "../../session/auth/session-info";
import { itemReferencesId } from "../entity-mapper/entity-relations.service";
import { firstValueFrom } from "rxjs";
import { UserAccountActionGuardService } from "../../user/user-admin-service/user-account-action-guard.service";

export class EntityDeletionAbortedError extends Error {
  constructor() {
    super("Entity deletion aborted by user");
    this.name = "EntityDeletionAbortedError";
  }
}

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
  private readonly accountActionGuard = inject(UserAccountActionGuardService);
  private readonly sessionInfo = inject(SessionSubject, { optional: true });

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
      const continueDeletion = await this.handleUserAccountDeletion(entity);
      if (!continueDeletion) {
        throw new EntityDeletionAbortedError();
      }
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

  private async handleUserAccountDeletion(entity: Entity): Promise<boolean> {
    const session = this.sessionInfo?.value;
    if (!session?.roles.includes(UserAdminService.ACCOUNT_MANAGER_ROLE)) {
      // Cannot manage accounts without admin role — skip silently
      return true;
    }

    let linkedAccount: UserAccount | null;
    try {
      linkedAccount = await firstValueFrom(
        this.userAdminService.getUser(entity.getId()),
      );
    } catch (error: unknown) {
      if (
        error instanceof UserAdminApiError &&
        (error.status === 403 || error.status === 404)
      ) {
        // API inaccessible for this user or account does not exist — skip silently
        return true;
      }
      throw error;
    }

    if (!linkedAccount) {
      return true;
    }

    if (
      this.accountActionGuard.isOwnAccount({ userEntityId: entity.getId() })
    ) {
      await this.accountActionGuard.showSelfAccountActionBlockedWarning(
        "delete",
      );
      return false;
    }

    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`:delete account confirmation title:Also delete linked user account?`,
      $localize`:delete account confirmation dialog:This entity has a linked user account. Do you also want to permanently delete the user account? This cannot be undone.`,
      YesNoCancelButtons,
    );

    if (confirmed === undefined) {
      return false;
    }

    if (!confirmed) {
      return true;
    }

    try {
      await firstValueFrom(this.userAdminService.deleteUser(entity.getId()));
    } catch (error: unknown) {
      if (error instanceof UserAdminApiError) {
        await this.confirmationDialog.getConfirmation(
          $localize`:delete account in keycloak related error title:Keycloak User could not be deleted`,
          $localize`:delete account in keycloak related error dialog:User Account could not be deleted in Keycloak. Please delete user manually in Keycloak.`,
          OkButton,
        );
        return true;
      }
      throw error;
    }

    return true;
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
