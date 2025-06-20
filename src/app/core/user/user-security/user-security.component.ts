import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AlertService } from "../../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
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

@UntilDestroy()
@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
  templateUrl: "./user-security.component.html",
  styleUrls: ["./user-security.component.scss"],
  imports: [
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class UserSecurityComponent implements OnInit {
  @Input() entity: Entity;
  form: FormGroup;
  availableRoles: Role[] = [];
  user: UserAccount;
  editing = true;
  userIsPermitted = false;

  constructor(
    private userAdminService: UserAdminService,
    sessionInfo: SessionSubject,
    private fb: FormBuilder,
    private alertService: AlertService,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      userEntityId: [{ value: "", disabled: true }],
      email: ["", [Validators.required, Validators.email]],
      roles: new FormControl<Role[]>([], Validators.required),
    });

    if (
      sessionInfo.value?.roles.includes(UserAdminService.ACCOUNT_MANAGER_ROLE)
    ) {
      this.userIsPermitted = true;
    } else {
      return;
    }
    // automatically skip trailing and leading whitespaces when the form changes
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((next) => {
      if (next.email?.startsWith(" ") || next.email?.endsWith(" ")) {
        this.form.get("email").setValue(next.email.trim());
      }
    });
    this.userAdminService
      .getAllRoles()
      .subscribe((roles) => this.initializeRoles(roles));
  }

  private initializeRoles(roles: Role[]) {
    this.availableRoles = roles;
    if (!this.user) {
      // assign "user_app" as default role for new users
      const userAppRole = roles.find(({ name }) => name === "user_app");
      if (userAppRole) {
        this.form.get("roles").setValue([userAppRole]);
      }
    }
  }

  ngOnInit() {
    if (!this.userIsPermitted) {
      return;
    }
    this.form.get("userEntityId").setValue(this.entity.getId());
    this.userAdminService
      .getUser(this.entity.getId())
      .pipe(
        // fallback: retry without entity prefix for legacy users
        switchMap((user) =>
          user === null
            ? this.userAdminService.getUser(this.entity.getId(true))
            : of(user),
        ),
      )
      .subscribe({
        next: (res) => this.assignUser(res),
        error: (err) => this.setError(err),
      });
  }

  private assignUser(user: UserAccount) {
    this.user = user;
    this.initializeForm();
    if (this.user) {
      this.disableForm();
    }
  }

  private initializeForm() {
    this.form.get("email").setValue(this.user?.email);
    this.form
      .get("roles")
      .setValue(
        (this.user?.roles ?? []).map((role) =>
          this.availableRoles.find((r) => r.id === role.id),
        ),
      );
    this.form.markAsPristine();
  }

  toggleAccount(enabled: boolean) {
    let message = $localize`:Snackbar message:Account has been disabled, user will not be able to login anymore.`;
    if (enabled) {
      message = $localize`:Snackbar message:Account has been activated, user can login again.`;
    }
    this.updateUserAccount({ enabled }, message);
  }

  editForm() {
    this.editing = true;
    if (this.user.enabled) {
      this.form.enable();
    }
  }

  disableForm() {
    this.editing = false;
    this.initializeForm();
    this.form.disable();
  }

  createAccount() {
    const user = this.getFormValues();
    if (!user) {
      return;
    }
    user.enabled = true;
    if (user) {
      this.userAdminService
        .createUser(user.userEntityId, user.email, user.roles)
        .subscribe({
          // TODO: check which form fields are really needed
          next: () => {
            this.alertService.addInfo(
              $localize`:Snackbar message:Account created. An email has been sent to ${
                this.form.get("email").value
              }`,
            );
            this.user = user as UserAccount;
            this.disableForm();
          },
          error: (err) => this.setError(err),
        });
    }
  }

  updateAccount() {
    const update = this.getFormValues();
    // only send values that have changed
    Object.keys(this.form.controls).forEach((control) =>
      this.form.get(control).pristine ? delete update[control] : undefined,
    );
    if (update) {
      this.updateUserAccount(
        update,
        $localize`:Snackbar message:Successfully updated user`,
      );
    }
  }

  private updateUserAccount(update: Partial<UserAccount>, message: string) {
    this.userAdminService.updateUser(this.user.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        Object.assign(this.user, update);
        this.disableForm();
        if (update.roles?.length > 0) {
          // roles changed, user might have more permissions now
          this.triggerSyncReset();
        }
      },
      error: (error) => {
        console.log(error);
        this.form.setErrors({ failed: error.message });
      },
    });
  }

  getFormValues(): Partial<UserAccount> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.form.setErrors({});
    return this.form.getRawValue();
  }

  private triggerSyncReset() {
    // TODO: does this need to be triggered for other CouchDBs as well?

    this.http
      .post(
        `${environment.DB_PROXY_PREFIX}/${Entity.DATABASE}/clear_local`,
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

    this.form.setErrors({ failed: errorMessage });
  }
}
