import { inject, Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { SessionSubject } from "../../session/auth/session-info";

export type SelfAccountAction = "delete" | "deactivate";

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

    return this.entityIdsMatch(session.entityId, account.userEntityId);
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

  private entityIdsMatch(sessionEntityId: string, accountEntityId: string) {
    if (sessionEntityId === accountEntityId) {
      return true;
    }

    const sessionHasTypePrefix = sessionEntityId.includes(":");
    const accountHasTypePrefix = accountEntityId.includes(":");
    if (sessionHasTypePrefix && accountHasTypePrefix) {
      return false;
    }

    return (
      this.getEntityIdWithoutTypePrefix(sessionEntityId) ===
      this.getEntityIdWithoutTypePrefix(accountEntityId)
    );
  }

  private getEntityIdWithoutTypePrefix(entityId: string) {
    return entityId.split(":").at(-1) ?? entityId;
  }
}
