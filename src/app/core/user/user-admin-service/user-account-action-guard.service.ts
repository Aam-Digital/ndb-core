import { inject, Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { SessionSubject } from "../../session/auth/session-info";

export type SelfAccountAction = "delete" | "deactivate";

/**
 * Compares two entity ids where one or both may be missing the `Type:` prefix
 * (e.g. a legacy `exact_username` stored without it), treating them as equal
 * when they refer to the same record.
 *
 * Exported for reuse wherever a stored/session entity id needs to be compared
 * against a value coming from an entity picker (which always includes the prefix).
 */
export function entityIdsMatch(
  entityIdA?: string | null,
  entityIdB?: string | null,
): boolean {
  if (!entityIdA || !entityIdB) {
    return entityIdA === entityIdB;
  }
  if (entityIdA === entityIdB) {
    return true;
  }

  const aHasTypePrefix = entityIdA.includes(":");
  const bHasTypePrefix = entityIdB.includes(":");
  if (aHasTypePrefix && bHasTypePrefix) {
    return false;
  }

  return (
    getEntityIdWithoutTypePrefix(entityIdA) ===
    getEntityIdWithoutTypePrefix(entityIdB)
  );
}

export function getEntityIdWithoutTypePrefix(entityId: string): string {
  return entityId.split(":").at(-1) ?? entityId;
}

@Injectable({
  providedIn: "root",
})
export class UserAccountActionGuardService {
  private readonly sessionInfo = inject(SessionSubject, { optional: true });
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  isOwnAccount(account: {
    userAccountId?: string | null;
    userEntityId?: string | null;
  }): boolean {
    const session = this.sessionInfo?.value;
    if (!session) {
      return false;
    }

    if (account.userAccountId && session.id === account.userAccountId) {
      return true;
    }

    if (!account.userEntityId || !session.entityId) {
      return false;
    }

    return entityIdsMatch(session.entityId, account.userEntityId);
  }

  async showSelfAccountActionBlockedWarning(
    action: SelfAccountAction,
  ): Promise<void> {
    if (action === "deactivate") {
      await this.confirmationDialog.getConfirmation(
        $localize`:self-deactivation warning title:Cannot disable own account`,
        $localize`:self-deactivation warning dialog:You cannot disable your own account. Please ask another admin to deactivate your account if needed.`,
        OkButton,
      );
      return;
    }

    await this.confirmationDialog.getConfirmation(
      $localize`:self-deletion warning title:Cannot delete own account`,
      $localize`:self-deletion warning dialog:You cannot delete your own account. Please ask another admin to remove your account if needed.`,
      OkButton,
    );
  }
}
