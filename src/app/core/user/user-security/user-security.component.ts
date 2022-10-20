import { Component } from "@angular/core";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import {
  KeycloakAuthService,
  KeycloakUser,
  Role,
} from "../../session/auth/keycloak/keycloak-auth.service";
import { AuthService } from "../../session/auth/auth.service";
import { User } from "../user";
import { PanelConfig } from "../../entity-components/entity-details/EntityDetailsConfig";
import { AlertService } from "../../alerts/alert.service";
import { SessionService } from "../../session/session-service/session.service";

@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
  styleUrls: ["./user-security.component.scss"],
  templateUrl: "./user-security.component.html",
})
export class UserSecurityComponent implements OnInitDynamicComponent {
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
    private fb: FormBuilder,
    authService: AuthService,
    private alertService: AlertService,
    private sessionService: SessionService
  ) {
    if (
      this.sessionService
        .getCurrentUser()
        .roles.includes(KeycloakAuthService.ACCOUNT_MANAGER_ROLE)
    ) {
      this.userIsPermitted = true;
    }
    if (authService instanceof KeycloakAuthService) {
      this.keycloak = authService;
      this.keycloak
        .getRoles()
        .subscribe((roles) => (this.availableRoles = roles));
    } else {
      this.form.disable();
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    const user = config.entity as User;
    this.form.get("username").setValue(user.name);
    if (this.keycloak) {
      this.keycloak.getUser(user.name).subscribe({
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
          this.availableRoles.find((r) => r.id === role.id)
        )
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
            }`
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
      this.form.get(control).pristine ? delete update[control] : undefined
    );
    if (update) {
      this.updateKeycloakUser(
        update,
        $localize`:Snackbar message:Successfully updated user`
      );
    }
  }

  private updateKeycloakUser(update: Partial<KeycloakUser>, message: string) {
    this.keycloak.updateUser(this.user.id, update).subscribe({
      next: () => {
        this.alertService.addInfo(message);
        Object.assign(this.user, update);
        this.disableForm();
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
}
