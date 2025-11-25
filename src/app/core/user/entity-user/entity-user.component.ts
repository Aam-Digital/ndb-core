import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SessionSubject } from "../../session/auth/session-info";
import { Entity } from "../../entity/model/entity";
import { switchMap } from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import {
  UserAdminApiError,
  UserAdminService,
} from "../user-admin-service/user-admin.service";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { Logging } from "app/core/logging/logging.service";
import { of } from "rxjs";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { UserDetailsComponent } from "../user-details/user-details.component";

/**
 * Component for managing user account security settings.
 * Used by admins to create, edit, and manage other users' accounts.
 * Can be used as a standalone view or in a dialog.
 */
@UntilDestroy()
@DynamicComponent("UserSecurity")
@Component({
  selector: "app-entity-user",
  templateUrl: "./entity-user.component.html",
  styleUrls: ["./entity-user.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatIconModule,
    FontAwesomeModule,
    DialogCloseComponent,
    UserDetailsComponent,
  ],
})
export class EntityUserComponent implements OnInit {
  private userAdminService = inject(UserAdminService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);
  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef = inject(MatDialogRef<EntityUserComponent>, {
    optional: true,
  });
  private sessionInfo = inject(SessionSubject);

  // Inputs
  entity = input<Entity>();

  // Signals
  user = signal<UserAccount | null>(null);
  availableRoles = signal<Role[]>([]);
  editing = signal<boolean>(true);
  userIsPermitted = signal<boolean>(false);
  isInDialog = signal<boolean>(false);
  formMode = signal<"create" | "edit" | "view">("view");

  // ViewChild reference to UserDetailsComponent
  @ViewChild('userDetailsForm') userDetailsForm: UserDetailsComponent;

  constructor() {
    // Check permissions
    if (
      this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      )
    ) {
      this.userIsPermitted.set(true);
    }

    // Load available roles
    this.userAdminService.getAllRoles().subscribe((roles) => {
      this.availableRoles.set(roles);
      this.initializeDefaultRoles(roles);
    });
  }

  private initializeDefaultRoles(roles: Role[]) {
    if (!this.user()) {
      // assign "user_app" as default role for new users
      const userAppRole = roles.find(({ name }) => name === "user_app");
      // Default role will be handled by the form component
    }
  }

  ngOnInit() {
    if (!this.userIsPermitted()) {
      return;
    }

    // Support both input and dialog injection
    let entityToUse = this.entity();
    if (this.dialogData?.entity) {
      entityToUse = this.dialogData.entity;
      this.isInDialog.set(true);
    }

    if (!entityToUse) {
      return;
    }

    // Load user account
    this.userAdminService
      .getUser(entityToUse.getId())
      .pipe(
        // fallback: retry without entity prefix for legacy users
        switchMap((user) =>
          user === null
            ? this.userAdminService.getUser(entityToUse.getId(true))
            : of(user),
        ),
      )
      .subscribe({
        next: (res) => this.assignUser(res),
        error: (err) => this.setError(err),
      });
  }

  private assignUser(user: UserAccount | null) {
    this.user.set(user);
    // if (user && !this.isInDialog()) {
    //   // In dialog mode, keep editing enabled; otherwise start in view mode
    //   this.disableForm();
    // } else if (user) {
    //   this.formMode.set("edit");
    // } else {
    //   // No user exists, set to create mode
    //   this.formMode.set("create");
    // }
  }

  toggleAccount(enabled: boolean) {
    let message = $localize`:Snackbar message:Account has been disabled, user will not be able to login anymore.`;
    if (enabled) {
      message = $localize`:Snackbar message:Account has been activated, user can login again.`;
    }
    this.updateUserAccount({ enabled }, message);
  }

  editForm() {
    this.editing.set(true);
    this.formMode.set("edit");
  }

  disableForm() {
    this.editing.set(false);
    this.formMode.set("view");
  }

  onFormSubmit(formData: Partial<UserAccount>) {
    const currentUser = this.user();
    if (currentUser) {
      // Update existing user
      this.updateAccount(formData);
    } else {
      // Create new user
      this.createAccount(formData);
    }
  }

  onFormCancel() {
    if (this.isInDialog()) {
      this.closeDialog();
    } else {
      this.disableForm();
    }
  }

  createNewAccount() {
    // Trigger form submission from the child component
    if (this.userDetailsForm) {
      this.userDetailsForm.onSubmit();
    }
  }

  saveAccount() {
    // Trigger form submission from the child component
    if (this.userDetailsForm) {
      this.userDetailsForm.onSubmit();
    }
  }

  createAccount(formData: Partial<UserAccount>) {
    const entityToUse = this.entity() || this.dialogData?.entity;
    if (!entityToUse) {
      return;
    }

    const userEntityId = entityToUse.getId();
    if (!formData.email || !formData.roles) {
      return;
    }

    this.userAdminService
      .createUser(userEntityId, formData.email, formData.roles)
      .subscribe({
        next: () => {
          this.alertService.addInfo(
            $localize`:Snackbar message:Account created. An email has been sent to ${formData.email}`,
          );
          this.user.set({
            ...formData,
            userEntityId: userEntityId,
            enabled: true,
          } as UserAccount);
          this.disableForm();
        },
        error: (err) => this.setError(err),
      });
  }

  updateAccount(formData: Partial<UserAccount>) {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    // Only send values that have changed
    const update: Partial<UserAccount> = {};
    if (formData.email !== currentUser.email) {
      update.email = formData.email;
    }
    if (JSON.stringify(formData.roles) !== JSON.stringify(currentUser.roles)) {
      update.roles = formData.roles;
    }

    // If nothing changed, just close/disable
    if (Object.keys(update).length === 0) {
      if (this.isInDialog()) {
        this.closeDialog();
      } else {
        this.disableForm();
      }
      return;
    }

    this.updateUserAccount(
      update,
      $localize`:Snackbar message:Successfully updated user`,
    );
  }

  private updateUserAccount(update: Partial<UserAccount>, message: string) {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    this.userAdminService.updateUser(currentUser.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        this.user.set({ ...currentUser, ...update });

        if (this.isInDialog()) {
          // Close dialog after successful update
          this.closeDialog();
        } else {
          this.disableForm();
        }

        if (update.roles?.length > 0) {
          // roles changed, user might have more permissions now
          this.triggerSyncReset();
        }
      },
      error: (error) => {
        console.log(error);
        this.setError(error);
      },
    });
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

  private setError(err: UserAdminApiError | any) {
    let errorMessage = err?.error?.message ?? err?.message;
    if (err instanceof UserAdminApiError) {
      errorMessage = err.message;
    } else {
      Logging.warn("Unexpected error from UserAdminService", err);
    }

    // Set error on the child form component if available
    if (this.userDetailsForm) {
      this.userDetailsForm.setGlobalError(errorMessage);
    }
  }

  closeDialog() {
    this.dialogRef?.close();
  }
}
