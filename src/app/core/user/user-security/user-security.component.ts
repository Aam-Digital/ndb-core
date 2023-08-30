import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  KeycloakAuthService,
  KeycloakUser,
  Role,
} from "../../session/auth/keycloak/keycloak-auth.service";
import { AuthService } from "../../session/auth/auth.service";
import { User } from "../user";
import { AlertService } from "../../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { AppSettings } from "../../app-settings";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserService } from "../user.service";

@UntilDestroy()
@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
  templateUrl: "./user-security.component.html",
  styleUrls: ["./user-security.component.scss"],
  imports: [
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgForOf,
  ],
  standalone: true,
})
export class UserSecurityComponent implements OnInit {
  @Input() entity: User;
  form = this.fb.group({
    username: [{ value: "", disabled: true }],
    email: ["", [Validators.required, Validators.email]],
    roles: new FormControl<Role[]>([]),
  });
  keycloak: KeycloakAuthService;
  availableRoles: Role[] = [];
  user: KeycloakUser;
  editing = true;
  userIsPermitted = false;

  constructor(
    authService: AuthService,
    userService: UserService,
    private fb: FormBuilder,
    private alertService: AlertService,
    private http: HttpClient,
  ) {
    if (
      userService
        .getCurrentUser()
        .roles.includes(KeycloakAuthService.ACCOUNT_MANAGER_ROLE)
    ) {
      this.userIsPermitted = true;
    }
    // automatically skip trailing and leading whitespaces when the form changes
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((next) => {
      if (next.email?.startsWith(" ") || next.email?.endsWith(" ")) {
        this.form.get("email").setValue(next.email.trim());
      }
    });
    if (authService instanceof KeycloakAuthService) {
      this.keycloak = authService;
      this.keycloak
        .getRoles()
        .subscribe((roles) => this.initializeRoles(roles));
    } else {
      this.form.disable();
    }
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
    this.form.get("username").setValue(this.entity.name);
    if (this.keycloak) {
      this.keycloak.getUser(this.entity.name).subscribe({
        next: (res) => this.assignUser(res),
        error: () => undefined,
      });
    }
  }

  private assignUser(user: KeycloakUser) {
    this.user = user;
    this.initializeForm();
    if (this.user) {
      this.disableForm();
    }
  }

  private initializeForm() {
    this.form.get("email").setValue(this.user.email);
    this.form
      .get("roles")
      .setValue(
        this.user.roles.map((role) =>
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
    this.updateKeycloakUser({ enabled }, message);
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
    user.enabled = true;
    if (user) {
      this.keycloak.createUser(user).subscribe({
        next: () => {
          this.alertService.addInfo(
            $localize`:Snackbar message:Account created. An email has been sent to ${
              this.form.get("email").value
            }`,
          );
          this.user = user as KeycloakUser;
          this.disableForm();
        },
        error: ({ error }) => this.form.setErrors({ failed: error.message }),
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
      this.updateKeycloakUser(
        update,
        $localize`:Snackbar message:Successfully updated user`,
      );
    }
  }

  private updateKeycloakUser(update: Partial<KeycloakUser>, message: string) {
    this.keycloak.updateUser(this.user.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        Object.assign(this.user, update);
        this.disableForm();
        if (update.roles?.length > 0) {
          // roles changed, user might have more permissions now
          this.triggerSyncReset();
        }
      },
      error: ({ error }) => this.form.setErrors({ failed: error.message }),
    });
  }

  getFormValues(): Partial<KeycloakUser> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.form.setErrors({});
    return this.form.getRawValue();
  }

  private triggerSyncReset() {
    this.http
      .post(
        `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}/clear_local`,
        undefined,
      )
      .subscribe({
        next: () => undefined,
        // request fails if no permission backend is used - this is fine
        error: () => undefined,
      });
  }
}
