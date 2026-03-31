import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { YesNoCancelButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import {
  Role,
  UserAccount,
} from "app/core/user/user-admin-service/user-account";
import { catchError, lastValueFrom, of } from "rxjs";

export interface AccountMergeDecision {
  accountUpdate: {
    accountId: string;
    update: Partial<UserAccount>;
  } | null;
  deleteSecondaryAccount: boolean;
}

@Component({
  selector: "app-merge-account-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  imports: [
    ReactiveFormsModule,
    MatError,
    MatRadioModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: "./merge-account-section.component.html",
  styleUrl: "./merge-account-section.component.scss",
})
export class MergeAccountSectionComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  entitiesToMerge = input.required<Entity[]>();
  entityConstructor = input.required<EntityConstructor>();

  readonly entityAccounts = signal<(UserAccount | null)[]>([null, null]);
  readonly accountLoadError = signal<boolean>(false);
  /** Index of the entity whose ID will be retained after merge. */
  readonly primaryIndex = signal<number>(0);
  readonly selectedAccountIndex = signal<number | null>(null);
  readonly availableRoles = signal<Role[]>([]);
  readonly selectedRolesControl = signal<FormControl<Role[]> | null>(null);
  readonly deleteSecondaryAccount = signal<boolean>(true);

  readonly hasAnyUserAccount = computed(() =>
    this.entityAccounts().some((a) => a != null),
  );
  readonly selectedAccountIndexValue = computed(() => {
    const selectedIndex = this.selectedAccountIndex();
    return selectedIndex == null ? null : String(selectedIndex);
  });

  ngOnInit(): Promise<void> {
    return this.initializeAccountData();
  }

  private async initializeAccountData(): Promise<void> {
    await this.loadAccounts();
    if (!this.hasAnyUserAccount()) return;

    await this.loadAvailableRoles();
    this.setPrimaryIndex(this.primaryIndex());
  }

  private async loadAccounts(): Promise<void> {
    if (!this.entityConstructor().enableUserAccounts) return;

    const results = await Promise.all(
      this.entitiesToMerge().map((e) => this.fetchUserAccount(e)),
    );
    this.entityAccounts.set(results.map((r) => r.account));
    this.accountLoadError.set(results.some((r) => r.error));

    if (!results[0].account && results[1]?.account) {
      this.primaryIndex.set(1);
    } else {
      this.primaryIndex.set(0);
    }
  }

  private async fetchUserAccount(
    entity: Entity,
  ): Promise<{ account: UserAccount | null; error: boolean }> {
    try {
      const account = await lastValueFrom(
        this.userAdminService.getUser(entity.getId()).pipe(
          catchError((err) => {
            if (err?.status === 404) return of(null);
            throw err;
          }),
        ),
      );
      return { account, error: false };
    } catch {
      return { account: null, error: true };
    }
  }

  private async loadAvailableRoles(): Promise<void> {
    try {
      this.availableRoles.set(
        await lastValueFrom(this.userAdminService.getAllRoles()),
      );
    } catch {
      this.availableRoles.set(
        this.uniqueRoles(
          this.entityAccounts().flatMap((account) => account?.roles ?? []),
        ),
      );
    }
  }

  hasSelectableAccount(index: number): boolean {
    return this.entityAccounts()[index] != null;
  }

  hasAccountEmail(index: number): boolean {
    return !!this.entityAccounts()[index]?.email;
  }

  selectAccountToKeep(index: number | string): void {
    const parsedIndex = Number(index);
    if (
      !Number.isInteger(parsedIndex) ||
      !this.hasSelectableAccount(parsedIndex)
    ) {
      return;
    }
    this.setPrimaryIndex(parsedIndex);
  }

  private setPrimaryIndex(index: number): void {
    this.primaryIndex.set(index);
    this.selectedAccountIndex.set(index);
    this.resetSelectedRolesForIndex(index);
  }

  private resetSelectedRolesForIndex(index: number): void {
    const roles = this.getAccountRoles(index);
    const control = this.selectedRolesControl();

    if (!control) {
      this.selectedRolesControl.set(new FormControl<Role[]>(roles));
      return;
    }

    control.setValue(roles);
    control.markAsPristine();
  }

  formatRoles(account: UserAccount | null | undefined): string {
    if (!account?.roles?.length) return "-";
    return account.roles.map((r) => r.name).join(", ");
  }

  formatAccountStatus(account: UserAccount | null | undefined): string {
    if (!account) return "-";
    return account.enabled ? $localize`Enabled` : $localize`Disabled`;
  }

  formatSelectedAccountStatus(): string {
    const selectedIndex = this.selectedAccountIndex();
    if (selectedIndex == null) return "-";
    return this.formatAccountStatus(this.entityAccounts()[selectedIndex]);
  }

  selectedAccountEmail(): string {
    const selectedIndex = this.selectedAccountIndex();
    if (selectedIndex == null) return "-";
    return this.entityAccounts()[selectedIndex]?.email ?? "-";
  }

  hasAccountRoles(index: number): boolean {
    return this.getAccountRoles(index).length > 0;
  }

  isAccountRolesSelected(index: number): boolean {
    const selectedRoles = this.selectedRolesControl()?.value ?? [];
    const selectedRoleIds = new Set(selectedRoles.map((r) => r.id));
    const accountRoles = this.getAccountRoles(index);

    if (!accountRoles.length) return false;
    return accountRoles.every((role) => selectedRoleIds.has(role.id));
  }

  toggleAccountRoles(index: number, checked: boolean): void {
    const selectedRoles = this.selectedRolesControl()?.value ?? [];
    const accountRoles = this.getAccountRoles(index);
    if (!accountRoles.length) return;

    const selectedMap = new Map(selectedRoles.map((r) => [r.id, r]));
    if (checked) {
      accountRoles.forEach((role) => selectedMap.set(role.id, role));
    } else {
      accountRoles.forEach((role) => selectedMap.delete(role.id));
    }

    this.selectedRolesControl()?.setValue(Array.from(selectedMap.values()));
    this.selectedRolesControl()?.markAsDirty();
  }

  private getAccountRoles(index: number): Role[] {
    return this.uniqueRoles(
      (this.entityAccounts()[index]?.roles ?? []).map(
        (role) =>
          this.availableRoles().find(
            (availableRole) => availableRole.id === role.id,
          ) ?? role,
      ),
    );
  }

  private uniqueRoles(roles: Role[]): Role[] {
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    return Array.from(roleMap.values());
  }

  private buildAccountUpdate(): {
    accountId: string;
    update: Partial<UserAccount>;
  } | null {
    const selectedIndex = this.selectedAccountIndex();
    if (selectedIndex == null) return null;

    const selectedAccount = this.entityAccounts()[selectedIndex];
    if (!selectedAccount?.id) return null;

    const control = this.selectedRolesControl();
    if (!control?.dirty) return null;

    const selectedRoles = control.value ?? [];
    const existingRoles = selectedAccount.roles ?? [];

    const selectedIds = new Set(selectedRoles.map((r) => r.id));
    const existingIds = new Set(existingRoles.map((r) => r.id));
    const rolesChanged =
      selectedIds.size !== existingIds.size ||
      [...selectedIds].some((id) => !existingIds.has(id));

    if (!rolesChanged) return null;

    return {
      accountId: selectedAccount.id,
      update: { roles: selectedRoles },
    };
  }

  async validateAndGetDecision(): Promise<false | AccountMergeDecision> {
    this.deleteSecondaryAccount.set(true);

    if (
      this.accountLoadError() &&
      this.entityConstructor().enableUserAccounts
    ) {
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:merge account load error title:Warning! User account status unknown`,
        $localize`:merge account load error:User account information could not be loaded (you may be offline or lack account_manager permissions). Proceeding may leave an orphaned user account. Are you sure you want to continue?`,
      );
      if (!confirmed) return false;
    }

    const accountsFound = this.entityAccounts().filter((a) => a != null);
    if (accountsFound.length === 1) {
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:merge account warning title:Warning! User account(s) found`,
        $localize`:merge account warning one account:One of the records has a linked user account. This account will remain linked as a login for the merged record.\nAre you sure you want to continue?`,
      );
      if (!confirmed) return false;
    }

    if (accountsFound.length === 2) {
      const selectedIndex = this.selectedAccountIndex() ?? this.primaryIndex();
      const secondaryIndex = selectedIndex === 0 ? 1 : 0;
      const selectedEmail = this.entityAccounts()[selectedIndex]?.email ?? "-";
      const secondaryEmail =
        this.entityAccounts()[secondaryIndex]?.email ?? "-";

      const result = await this.confirmationDialog.getConfirmation(
        $localize`:merge account warning title:Warning! User account(s) found`,
        $localize`:merge account warning both accounts:Both records have a linked user account. You have selected the account for ${selectedEmail}:selectedEmail: to remain linked to the merged record.\nDo you want to delete the second account ${secondaryEmail}:secondaryEmail: (which will not have a linked record after this merge)?`,
        YesNoCancelButtons,
      );

      if (result === undefined) {
        return false;
      }
      this.deleteSecondaryAccount.set(result === true);
    }

    return {
      accountUpdate: this.buildAccountUpdate(),
      deleteSecondaryAccount: this.deleteSecondaryAccount(),
    };
  }
}
