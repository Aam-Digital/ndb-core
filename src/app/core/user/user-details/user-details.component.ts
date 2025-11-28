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
import { MatDialogModule } from "@angular/material/dialog";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { AlertService } from "../../alerts/alert.service";
import { Entity } from "../../entity/model/entity";

export interface UserDetailsConfig {
  userAccount: UserAccount | null;
  entity: Entity | null;
  showPasswordChange: boolean;
  disabled: boolean;
  editing: boolean;
  userIsPermitted: boolean;
  isInDialog: boolean;
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
  ],
})
export class UserDetailsComponent {
  private fb = inject(FormBuilder);
  private userAdminService = inject(UserAdminService);
  private alertService = inject(AlertService);

  config = input.required<UserDetailsConfig>();

  userAccount = computed(() => this.config().userAccount);
  entity = computed(() => this.config().entity);
  showPasswordChange = computed(() => this.config().showPasswordChange);
  disabled = computed(() => this.config().disabled);
  editing = computed(() => this.config().editing);
  userIsPermitted = computed(() => this.config().userIsPermitted);
  isInDialog = computed(() => this.config().isInDialog);

  availableRoles = signal<Role[]>([]);

  action = output<UserDetailsAction>();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      roles: new FormControl<Role[]>([], Validators.required),
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
      const user = this.userAccount();
      if (user) {
        this.updateFormFromUser(user);
      }
    });

    effect(() => {
      if (this.disabled()) {
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
        roles: (user.roles ?? []).map((role) =>
          this.availableRoles().find((r) => r.id === role.id),
        ),
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
    const currentUser = this.userAccount();

    if (currentUser) {
      this.updateAccount(formValue);
    } else {
      this.createAccount(formValue);
    }
  }

  private createAccount(formData: Partial<UserAccount>) {
    const entity = this.entity();
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
      this.action.emit({ type: "formCancel" });
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
}
