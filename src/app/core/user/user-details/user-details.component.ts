import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { AlertService } from "../../alerts/alert.service";
import { Entity } from "../../entity/model/entity";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SessionSubject } from "../../session/auth/session-info";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { AsyncPipe } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";

export type UserDetailsMode = "profile" | "entity" | "dialog";

export interface UserDetailsDialogData {
  userAccount: UserAccount | null;
  mode: UserDetailsMode;
  editing: boolean;
  userIsPermitted: boolean;
}

export interface UserDetailsAction {
  type:
    | "formCancel"
    | "editRequested"
    | "closeDialog"
    | "accountCreated"
    | "accountUpdated";
  data?: any;
}

/**
 * Reusable user account details form component.
 */
@UntilDestroy()
@Component({
  selector: "app-user-details",
  templateUrl: "./user-details.component.html",
  styleUrls: ["./user-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    DialogCloseComponent,
    Angulartics2Module,
    EntityBlockComponent,
    AsyncPipe,
  ],
})
export class UserDetailsComponent {
  private fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly alertService = inject(AlertService);
  private readonly _dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly authService = inject(KeycloakAuthService, {
    optional: true,
  });
  protected sessionInfo = inject(SessionSubject, { optional: true });
  protected currentUser = inject(CurrentUserSubject, { optional: true });

  get dialogData() {
    return this._dialogData;
  }

  userAccount = input<UserAccount | null>();
  entity = input<Entity | null>();
  mode = input<UserDetailsMode>("entity");
  editing = input<boolean>(false);
  userIsPermitted = input<boolean>(false);

  disabled = computed(() => !this.editing());

  userIsPermittedComputed = computed(
    () =>
      this.userIsPermitted() ||
      this._dialogData?.userIsPermitted ||
      this.mode() === "profile",
  );

  isInDialog = computed(
    () =>
      this.mode() === "dialog" ||
      this._dialogData?.mode === "dialog" ||
      !!this._dialogData,
  );

  showUsername = computed(() => this.mode() === "profile" || this.isInDialog());

  showPasswordChange = computed(() => this.mode() === "profile");

  showEntityProfile = computed(() => this.mode() === "profile");

  passwordChangeDisabled = computed(() => {
    if (this.mode() !== "profile") return false;

    if (environment.session_type !== SessionType.synced) {
      return true; // Disabled in demo mode
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return true; // Disabled when offline
    }
    return false;
  });

  currentUserAccount = computed(() => {
    // If userAccount is provided directly, use it
    const directUser = this.userAccount() ?? this._dialogData?.userAccount;
    if (directUser) {
      return directUser;
    }

    const isProfileMode = this.showUsername();
    if (isProfileMode && this.sessionInfo?.value) {
      return {
        email: this.sessionInfo.value.email,
        enabled: true,
        roles:
          this.sessionInfo.value.roles?.map((role) => ({
            id: role,
            name: role,
          })) || [],
      } as UserAccount;
    }

    return null;
  });
  currentEntity = computed(
    () => this.entity() ?? this._dialogData?.entity ?? null,
  );

  availableRoles = signal<Role[]>([]);

  action = output<UserDetailsAction>();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      roles: new FormControl<Role[]>([]),
    });

    // Add roles validation only when not in profile mode
    effect(() => {
      const isProfileMode =
        this.showUsername() || this._dialogData?.mode === "profile";
      const rolesControl = this.form.get("roles");
      if (rolesControl) {
        if (isProfileMode) {
          rolesControl.clearValidators();
        } else {
          rolesControl.setValidators([Validators.required]);
        }
        rolesControl.updateValueAndValidity();
      }
    });

    this.userAdminService
      .getAllRoles()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);
        },
        error: (err) => {
          console.error("Failed to load available roles:", err);
          this.availableRoles.set([]);
        },
      });

    // Auto-trim whitespace from email
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((next) => {
      if (next.email?.startsWith(" ") || next.email?.endsWith(" ")) {
        this.form
          .get("email")
          ?.setValue(next.email.trim(), { emitEvent: false });
      }
    });

    effect(() => {
      const user = this.currentUserAccount();
      const roles = this.availableRoles();
      if (user && roles.length > 0) {
        this.updateFormFromUser(user);
      }
    });

    effect(() => {
      const isDisabled = this.disabled() || this._dialogData?.disabled || false;
      if (isDisabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  private updateFormFromUser(user: UserAccount) {
    this.form.patchValue(
      {
        email: user.email,
        roles: (user.roles ?? [])
          .map((role) => this.availableRoles().find((r) => r.id === role.id))
          .filter((role): role is Role => role !== undefined), // Filter out undefined roles
      },
      { emitEvent: false },
    );
    this.form.markAsPristine();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const currentUser = this.currentUserAccount();

    if (currentUser) {
      this.updateAccount(formValue);
    } else {
      this.createAccount(formValue);
    }
  }

  private createAccount(formData: Partial<UserAccount>) {
    const entity = this.currentEntity();
    if (!entity) {
      this.alertService.addDanger("No entity available for user creation");
      return;
    }

    const userEntityId = entity.getId();
    if (!formData.email || !formData.roles) {
      return;
    }

    this.userAdminService
      .createUser(userEntityId, formData.email, formData.roles)
      .subscribe({
        next: (createdUser) => {
          this.alertService.addInfo(
            $localize`:Snackbar message:Account created. An email has been sent to ${formData.email}`,
          );
          this.action.emit({
            type: "accountCreated",
            data: {
              ...formData,
              userEntityId: userEntityId,
              enabled: true,
            } as UserAccount,
          });
        },
        error: (err) => {
          this.alertService.addDanger(
            err?.error?.message || err?.message || "Failed to create account",
          );
        },
      });
  }

  private updateAccount(formData: Partial<UserAccount>) {
    const currentUser = this.currentUserAccount();
    if (!currentUser) {
      return;
    }

    const update: Partial<UserAccount> = {};
    if (formData.email !== currentUser.email) {
      update.email = formData.email;
    }
    if (JSON.stringify(formData.roles) !== JSON.stringify(currentUser.roles)) {
      update.roles = formData.roles;
    }

    if (Object.keys(update).length === 0) {
      this.action.emit({ type: "formCancel" });
      return;
    }

    this.updateUserAccount(
      update,
      $localize`:Snackbar message:Successfully updated user`,
    );
  }

  private updateUserAccount(update: Partial<UserAccount>, message: string) {
    const currentUser = this.currentUserAccount();
    if (!currentUser) {
      return;
    }

    this.userAdminService.updateUser(currentUser.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        const updatedUser = { ...currentUser, ...update };
        this.action.emit({
          type: "accountUpdated",
          data: {
            user: updatedUser,
            triggerSyncReset: update.roles?.length > 0,
          },
        });
      },
      error: (error) => {
        console.log(error);
        this.alertService.addDanger(
          error?.error?.message ||
            error?.message ||
            "Failed to update user account",
        );
      },
    });
  }

  onToggleAccount(enabled: boolean) {
    const message = enabled
      ? $localize`:Snackbar message:Account has been activated, user can login again.`
      : $localize`:Snackbar message:Account has been disabled, user will not be able to login anymore.`;

    this.updateUserAccount({ enabled }, message);
  }

  onCancel() {
    this.action.emit({ type: "formCancel" });
  }

  getFormError(field: string, errorType: string): boolean {
    return this.form.get(field)?.hasError(errorType) ?? false;
  }

  getGlobalError(): string | null {
    return this.form.getError("failed");
  }

  onEdit() {
    this.action.emit({ type: "editRequested" });
  }

  onCloseDialog() {
    this.action.emit({ type: "closeDialog" });
  }

  onChangePassword() {
    if (this.authService) {
      this.authService.changePassword();
    }
  }
}
