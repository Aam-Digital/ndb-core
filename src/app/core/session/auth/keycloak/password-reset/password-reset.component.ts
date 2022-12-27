import { Component } from "@angular/core";
import { AuthService } from "../../auth.service";
import { KeycloakAuthService } from "../keycloak-auth.service";
import { FormControl, Validators } from "@angular/forms";
import { MatLegacySnackBar as MatSnackBar } from "@angular/material/legacy-snack-bar";

@Component({
  selector: "app-password-reset",
  templateUrl: "./password-reset.component.html",
})
export class PasswordResetComponent {
  keycloakAuth: KeycloakAuthService;
  passwordResetActive = false;
  email = new FormControl("", [Validators.required, Validators.email]);

  constructor(authService: AuthService, private snackbar: MatSnackBar) {
    if (authService instanceof KeycloakAuthService) {
      this.keycloakAuth = authService;
    }
  }

  toggleEmailForm() {
    this.passwordResetActive = !this.passwordResetActive;
  }

  sendEmail() {
    if (this.email.invalid) {
      return;
    }

    this.keycloakAuth.forgotPassword(this.email.value).subscribe({
      next: () => {
        this.snackbar.open(
          `Password reset email sent to ${this.email.value}`,
          undefined,
          { duration: 10000 }
        );
        this.toggleEmailForm();
      },
      error: (err) => this.email.setErrors({ notFound: err.error.message }),
    });
  }
}
