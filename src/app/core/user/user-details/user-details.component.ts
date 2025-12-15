import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
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
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { AlertService } from "../../alerts/alert.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SessionSubject } from "../../session/auth/session-info";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Angulartics2Module } from "angulartics2";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";
import { EditEntityComponent } from "../../basic-datatypes/entity/edit-entity/edit-entity.component";
import { lastValueFrom } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Options as input to the UserDetailsComponent when it is opened in a dialog.
 */
export interface UserDetailsDialogData {
  userAccount: UserAccount | null;
}

/**
 * Return value of the UserDetailsComponent after a user interacts with it.
 */
export interface UserDetailsAction {
  type: "formCancel" | "editRequested" | "accountCreated" | "accountUpdated";
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
    EditEntityComponent,
  ],
})
export class UserDetailsComponent {
  private fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly alertService = inject(AlertService);
  private readonly http = inject(HttpClient);
  private readonly _dialogData: UserDetailsDialogData = inject(
    MAT_DIALOG_DATA,
    { optional: true },
  );
  private readonly dialogRef = inject(
    MatDialogRef<UserDetailsComponent, UserDetailsAction>,
    { optional: true },
  );
  private readonly authService = inject(KeycloakAuthService, {
    optional: true,
  });
  protected sessionInfo = inject(SessionSubject, { optional: true });
  protected currentUser = inject(CurrentUserSubject, { optional: true });

  userAccount = input<UserAccount | null>(this._dialogData?.userAccount);
  isInDialog = input<boolean>(!!this._dialogData || false);
  isProfileMode = input<boolean>(false);

  /**
   * Signal tracking whether the form is disabled (view mode) or enabled (edit mode).
   * This is automatically updating the `form.disabled` also.
   */
  formDisabled = signal(true);
  private readonly formDisabledEffect = effect(() => {
    // special form rules:
    if (this.isProfileMode() && !this.formDisabled()) {
      this.formDisabled.set(true);
    }

    if (this.formDisabled()) {
      this.form.disable();
    } else {
      this.form.enable();

      // profile entity is currently always readonly. Updates not supported yet
      this.form.get("userEntityId").disable();
    }
  });

  showPasswordChange = computed(() => this.isProfileMode());
  passwordChangeDisabled = computed(() => {
    if (!this.isProfileMode()) return false;

    if (environment.session_type !== SessionType.synced) {
      return true; // Disabled in demo mode
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return true; // Disabled when offline
    }
    return false;
  });

  creatingNewAccount = computed(() => {
    return !this.userAccount()?.id && !this.isProfileMode();
  });

  availableRoles = resource<Role[], unknown>({
    loader: async () => {
      if (this.isProfileMode()) {
        return [];
      }

      try {
        return await lastValueFrom(this.userAdminService.getAllRoles());
      } catch (err) {
        // in profile view, this may be expected
        Logging.debug("Failed to load available roles:", err);
        return [];
      }
    },
    defaultValue: [],
  });

  form: FormGroup;

  constructor() {
    this.initForm();

    // Add roles validation only when not in profile mode
    effect(() => {
      const isProfileMode = this.isProfileMode();
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

    // Auto-trim whitespace from email
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((next) => {
      if (next.email?.startsWith(" ") || next.email?.endsWith(" ")) {
        this.form
          .get("email")
          ?.setValue(next.email.trim(), { emitEvent: false });
      }
    });

    effect(() => {
      const user = this.userAccount();
      if (user) {
        this.updateFormFromUser(user);
      }
    });
  }

  private initForm() {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      roles: new FormControl<Role[]>([]),
      userEntityId: new FormControl<string | null>(null),
    });

    // Initialize form as disabled
    if (!this.creatingNewAccount()) {
      this.formDisabled.set(true);
    } else {
      this.formDisabled.set(false);
    }

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.markAllAsTouched();
      this.form.markAsDirty();
    });
  }

  getSessionRolesDisplayText(): string {
    if (!this.isProfileMode() || !this.sessionInfo?.value?.roles) {
      return "";
    }
    return this.sessionInfo.value.roles.join(", ");
  }

  private updateFormFromUser(user: UserAccount) {
    this.form.patchValue(
      {
        email: user.email,
        roles: (user.roles ?? [])
          .map((role) =>
            this.availableRoles.value()?.find((r) => r.id === role.id),
          )
          .filter((role): role is Role => role !== undefined), // Filter out undefined roles
        userEntityId: !user.userEntityId
          ? null
          : user.userEntityId.includes(":")
            ? user.userEntityId
            : "User:" + user.userEntityId,
      },
      { emitEvent: false },
    );

    this.form.markAsPristine();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.creatingNewAccount()) {
      this.createAccount(formValue);
    } else {
      this.updateAccount(formValue);
    }
  }

  private createAccount(formData: Partial<UserAccount>) {
    const userEntityId = formData.userEntityId;
    if (!userEntityId) {
      this.alertService.addDanger(
        $localize`:Error message:No profile ID available for user creation`,
      );
      return;
    }

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
          this.exitEditMode({
            type: "accountCreated",
            data: {
              ...formData,
              userEntityId: userEntityId,
              enabled: true,
              id: createdUser.id,
            } as UserAccount,
          });
        },
        error: (err) => {
          this.alertService.addDanger(
            err?.error?.message ||
              err?.message ||
              $localize`:Error message:Failed to create account`,
          );
        },
      });
  }

  private updateAccount(formData: Partial<UserAccount>) {
    const currentUser = this.userAccount();
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
      this.exitEditMode({ type: "formCancel" });
      return;
    }

    this.updateUserAccount(
      update,
      $localize`:Snackbar message:Successfully updated user`,
    );
  }

  private updateUserAccount(update: Partial<UserAccount>, message: string) {
    const currentUser = this.userAccount();
    if (!currentUser) {
      return;
    }

    this.userAdminService.updateUser(currentUser.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        const updatedUser = { ...currentUser, ...update };
        if (update.roles?.length > 0) {
          this.triggerSyncReset();
        }
        this.exitEditMode({
          type: "accountUpdated",
          data: {
            user: updatedUser,
          },
        });
      },
      error: (error) => {
        this.alertService.addDanger(
          error?.error?.message ||
            error?.message ||
            $localize`:Error message:Failed to update user account`,
        );
      },
    });
  }

  enableAccount(enabled: boolean) {
    const message = enabled
      ? $localize`:Snackbar message:Account has been activated, user can login again.`
      : $localize`:Snackbar message:Account has been disabled, user will not be able to login anymore.`;

    this.updateUserAccount({ enabled }, message);
  }

  editMode() {
    this.formDisabled.set(false);
  }

  cancel() {
    this.form.reset();
    const user = this.userAccount();
    if (user) {
      this.updateFormFromUser(user);
    }

    this.exitEditMode({ type: "formCancel" });
  }

  private exitEditMode(result: UserDetailsAction) {
    this.formDisabled.set(true);

    if (this.dialogRef) {
      this.dialogRef.close(result);
    }
  }

  getFormError(field: string, errorType: string): boolean {
    return this.form.get(field)?.hasError(errorType) ?? false;
  }

  getGlobalError(): string | null {
    return this.form.getError("failed");
  }

  changePassword() {
    if (this.authService) {
      this.authService.changePassword();
    }
  }

  /**
   * Reset server DB sync state to ensure previously hidden docs are re-synced
   * after an account has gained more access permissions.
   *
   * see https://github.com/Aam-Digital/replication-backend/blob/master/src/admin/admin.controller.ts
   * @private
   */
  private triggerSyncReset() {
    this.http
      .post(
        `${environment.DB_PROXY_PREFIX}/admin/clear_local/${Entity.DATABASE}`,
        undefined,
      )
      .subscribe({
        next: () => undefined,
        // request fails if no permission backend is used - this is fine
        error: () => undefined,
      });
  }
}
