import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import {
  Role,
  UserAccount,
} from "app/core/user/user-admin-service/user-account";
import { catchError, lastValueFrom, of } from "rxjs";

@Component({
  selector: "app-merge-account-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  imports: [
    ReactiveFormsModule,
    MatError,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: "./merge-account-section.component.html",
  styleUrl: "./merge-account-section.component.scss",
})
export class MergeAccountSectionComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly fb = inject(FormBuilder);

  entitiesToMerge = input.required<Entity[]>();
  entityConstructor = input.required<EntityConstructor>();

  readonly entityAccounts = signal<(UserAccount | null)[]>([null, null]);
  readonly accountLoadError = signal<boolean>(false);
  /** Index of the entity whose ID will be retained after merge (the one with the account, if any). */
  readonly primaryIndex = signal<number>(0);

  readonly hasAnyUserAccount = computed(() =>
    this.entityAccounts().some((a) => a != null),
  );

  /** Reactive form for editing the surviving account's email and roles */
  readonly accountForm = signal<FormGroup | null>(null);
  readonly availableRoles = signal<Role[]>([]);
  readonly selectedAccountEmailIndex = signal<number | null>(null);

  readonly accountEmailControl = computed(
    () => this.accountForm()?.get("email") as FormControl,
  );

  readonly accountRolesControl = computed(
    () => this.accountForm()?.get("roles") as FormControl,
  );

  formatRoles(account: UserAccount | null | undefined): string {
    if (!account?.roles?.length) return "-";
    return account.roles.map((r) => r.name).join(", ");
  }

  hasAccountEmail(index: number): boolean {
    return !!this.entityAccounts()[index]?.email;
  }

  selectAccountEmail(index: number): void {
    this.selectedAccountEmailIndex.set(index);
    this.accountEmailControl()?.setValue(this.entityAccounts()[index]?.email);
    this.accountEmailControl()?.markAsDirty();
  }

  hasAccountRoles(index: number): boolean {
    return this.getAccountRoles(index).length > 0;
  }

  isAccountRolesSelected(index: number): boolean {
    const selectedRoles = (this.accountRolesControl()?.value ?? []) as Role[];
    const selectedRoleIds = new Set(selectedRoles.map((r) => r.id));
    const accountRoles = this.getAccountRoles(index);

    if (!accountRoles.length) {
      return false;
    }

    return accountRoles.every((role) => selectedRoleIds.has(role.id));
  }

  toggleAccountRoles(index: number, checked: boolean): void {
    const selectedRoles = (this.accountRolesControl()?.value ?? []) as Role[];
    const accountRoles = this.getAccountRoles(index);
    if (!accountRoles.length) return;

    const selectedMap = new Map(selectedRoles.map((r) => [r.id, r]));
    if (checked) {
      accountRoles.forEach((role) => selectedMap.set(role.id, role));
    } else {
      accountRoles.forEach((role) => selectedMap.delete(role.id));
    }

    this.accountRolesControl()?.setValue(Array.from(selectedMap.values()));
    this.accountRolesControl()?.markAsDirty();
  }

  async ngOnInit(): Promise<void> {
    await this.loadAccounts();
    if (this.hasAnyUserAccount()) {
      await this.initAccountForm();
    }
  }

  private async loadAccounts(): Promise<void> {
    if (!this.entityConstructor().enableUserAccounts) return;

    const results = await Promise.all(
      this.entitiesToMerge().map((e) => this.fetchUserAccount(e)),
    );
    this.entityAccounts.set(results.map((r) => r.account));
    this.accountLoadError.set(results.some((r) => r.error));

    // Entity with account should be primary (index retained after merge)
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

  private async initAccountForm(): Promise<void> {
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

    const primaryIdx = this.primaryIndex();
    const secondaryIdx = primaryIdx === 0 ? 1 : 0;
    if (this.hasAccountEmail(primaryIdx)) {
      this.selectedAccountEmailIndex.set(primaryIdx);
    } else if (this.hasAccountEmail(secondaryIdx)) {
      this.selectedAccountEmailIndex.set(secondaryIdx);
    } else {
      this.selectedAccountEmailIndex.set(null);
    }

    const defaultEmail =
      this.selectedAccountEmailIndex() != null
        ? (this.entityAccounts()[this.selectedAccountEmailIndex()!]?.email ??
          "")
        : "";

    // Map the current roles to available role objects to ensure reference equality for mat-select.
    const currentRoles = this.getAccountRoles(primaryIdx);

    this.accountForm.set(
      this.fb.group({
        email: [defaultEmail, [Validators.email]],
        roles: new FormControl<Role[]>(currentRoles),
      }),
    );

    this.accountEmailControl()?.valueChanges.subscribe((value) => {
      const accounts = this.entityAccounts();
      if (value === accounts[0]?.email) {
        this.selectedAccountEmailIndex.set(0);
      } else if (value === accounts[1]?.email) {
        this.selectedAccountEmailIndex.set(1);
      } else {
        this.selectedAccountEmailIndex.set(null);
      }
    });
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

  /**
   * Builds the account update payload from the current form values without making any API calls.
   * Returns null if there is no primary account or the form has no changes.
   */
  buildAccountUpdate(): {
    accountId: string;
    update: Partial<UserAccount>;
  } | null {
    const primaryAccount = this.entityAccounts()[this.primaryIndex()];
    if (!primaryAccount?.id || !this.accountForm()?.dirty) return null;

    const formValue = this.accountForm()!.getRawValue();
    const update: Partial<UserAccount> = {};

    if (formValue.email !== primaryAccount.email) {
      update.email = formValue.email;
    }
    if (
      JSON.stringify(formValue.roles) !== JSON.stringify(primaryAccount.roles)
    ) {
      update.roles = formValue.roles;
    }

    return Object.keys(update).length > 0
      ? { accountId: primaryAccount.id, update }
      : null;
  }

  /**
   * Validates the account form and returns the update payload in a single call.
   * Returns false if the form is invalid, otherwise the update payload (null if no changes).
   */
  validateAndGetUpdate():
    | false
    | null
    | { accountId: string; update: Partial<UserAccount> } {
    if (this.accountForm()?.invalid) return false;
    return this.buildAccountUpdate();
  }
}
