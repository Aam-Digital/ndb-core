import { Component } from "@angular/core";
import { AuthService } from "../../auth.service";
import { KeycloakAuthService } from "../keycloak-auth.service";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { AnalyticsService } from "../../../../analytics/analytics.service";

@Component({
  selector: "app-password-reset",
  templateUrl: "./password-reset.component.html",
  imports: [
    NgIf,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  standalone: true,
})
export class PasswordResetComponent {
  keycloakAuth: KeycloakAuthService;
  passwordResetActive = false;
  email = new FormControl("", [Validators.required, Validators.email]);

  constructor(
    authService: AuthService,
    private snackbar: MatSnackBar,
    private analytics: AnalyticsService,
  ) {
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
    this.analytics.eventTrack("password_reset", { category: "User" });

    this.keycloakAuth.forgotPassword(this.email.value).subscribe({
      next: () => {
        this.snackbar.open(
          `Password reset email sent to ${this.email.value}`,
          undefined,
          { duration: 10000 },
        );
        this.toggleEmailForm();
      },
      error: (err) => this.email.setErrors({ notFound: err.error.message }),
    });
  }
}