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
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { PanelConfig } from "../../entity-components/entity-details/EntityDetailsConfig";

@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
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
  userId: string;
  userEnabled: boolean = false;

  constructor(
    private fb: FormBuilder,
    authService: AuthService,
    private snackbar: MatSnackBar
  ) {
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
    this.form.get("email").setValue(user.email);
    this.form
      .get("roles")
      .setValue(
        user.roles.map((role) =>
          this.availableRoles.find((r) => r.id === role.id)
        )
      );
    this.userId = user.id;
    this.toggleForm(user.enabled);
  }

  createAccount() {
    this.executeObservableIfFormValid(
      this.keycloak.createUser(this.form.getRawValue()),
      $localize`:Snackbar message:An email has been sent to ${
        this.form.get("email").value
      }`
    );
  }

  toggleAccount(enabled: boolean) {
    this.keycloak.updateUser(this.userId, { enabled }).subscribe({
      next: () => this.toggleForm(enabled),
      error: ({ error }) => this.form.setErrors({ failed: error.message }),
    });
  }

  private toggleForm(enabled: boolean) {
    this.userEnabled = enabled;
    if (enabled) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  updateAccount() {
    const update = this.form.getRawValue();
    // only send values that have changed
    Object.keys(this.form.controls).forEach((control) =>
      this.form.get(control).pristine ? delete update[control] : undefined
    );
    this.executeObservableIfFormValid(
      this.keycloak.updateUser(this.userId, update),
      $localize`:Snackbar message:Successfully updated user`
    );
  }

  /**
   * A simple helper function that only subscribes to an observable if the form is valid.
   * As Angular HttpRequests return cold observables {@link https://stackoverflow.com/a/42817567/10713841}
   * the request is only sent once the observable is subscribed to.
   * @param obs the cold observable
   * @param message the message to show on success
   * @private
   */
  private executeObservableIfFormValid(obs: Observable<any>, message: string) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.form.setErrors({});
    obs.subscribe({
      next: () => this.snackbar.open(message, undefined, { duration: 5000 }),
      error: ({ error }) => this.form.setErrors({ failed: error.message }),
    });
  }
}
