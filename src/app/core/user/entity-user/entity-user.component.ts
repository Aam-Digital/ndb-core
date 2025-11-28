import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
 * Display User Account details and configuration related to a given profile Entity.
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
  private readonly userAdminService = inject(UserAdminService);
  private readonly alertService = inject(AlertService);
  private readonly http = inject(HttpClient);
  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef = inject(MatDialogRef<EntityUserComponent>, {
    optional: true,
  });
  private readonly sessionInfo = inject(SessionSubject);

  entity = input<Entity>();
  user = signal<UserAccount | null>(null);
  availableRoles = signal<Role[]>([]);
  editing = computed(
    () => this.formMode() === "edit" || this.formMode() === "create",
  );
  userIsPermitted = signal<boolean>(false);
  isInDialog = signal<boolean>(false);
  formMode = signal<"create" | "edit" | "view">("create");

  @ViewChild("userDetailsForm") userDetailsForm: UserDetailsComponent;

  constructor() {
    if (
      this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      )
    ) {
      this.userIsPermitted.set(true);
    }

    this.userAdminService.getAllRoles().subscribe((roles) => {
      this.availableRoles.set(roles);
    });
  }

  private getEntity(): Entity | undefined {
    if (this.dialogData?.entity) {
      return this.dialogData.entity;
    }
    const entityValue =
      typeof this.entity === "function" ? this.entity() : this.entity;
    return entityValue;
  }

  ngOnInit() {
    if (!this.userIsPermitted()) {
      return;
    }

    const entityToUse = this.getEntity();
    if (this.dialogData?.entity) {
      this.isInDialog.set(true);
    }

    if (!entityToUse) {
      return;
    }

    this.userAdminService
      .getUser(entityToUse.getId())
      .pipe(
        switchMap((user) =>
          user === null
            ? this.userAdminService.getUser(entityToUse.getId(true))
            : of(user),
        ),
      )
      .subscribe({
        next: (res) => {
          this.user.set(res);
          if (res) {
            this.formMode.set(this.isInDialog() ? "edit" : "view");
          } else {
            this.formMode.set("create");
          }
        },
        error: (err) => this.setError(err),
      });
  }

  toggleAccount(enabled: boolean) {
    let message = $localize`:Snackbar message:Account has been disabled, user will not be able to login anymore.`;
    if (enabled) {
      message = $localize`:Snackbar message:Account has been activated, user can login again.`;
    }
    this.updateUserAccount({ enabled }, message);
  }

  editForm() {
    this.formMode.set("edit");
  }

  disableForm() {
    this.formMode.set("view");
  }

  onFormSubmit(formData: Partial<UserAccount>) {
    const currentUser = this.user();
    if (currentUser) {
      this.updateAccount(formData);
    } else {
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

  submitForm() {
    if (this.userDetailsForm) {
      this.userDetailsForm.onSubmit();
    }
  }

  createAccount(formData: Partial<UserAccount>) {
    const entityToUse = this.getEntity();

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

    const update: Partial<UserAccount> = {};
    if (formData.email !== currentUser.email) {
      update.email = formData.email;
    }
    if (JSON.stringify(formData.roles) !== JSON.stringify(currentUser.roles)) {
      update.roles = formData.roles;
    }

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
          this.closeDialog();
        } else {
          this.disableForm();
        }

        if (update.roles?.length > 0) {
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

    if (this.userDetailsForm) {
      this.userDetailsForm.setGlobalError(errorMessage);
    }
  }

  closeDialog() {
    this.dialogRef?.close();
  }
}
