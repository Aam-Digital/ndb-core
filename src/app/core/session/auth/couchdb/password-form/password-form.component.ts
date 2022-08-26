import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, ValidationErrors, Validators } from "@angular/forms";
import { SessionService } from "../../../session-service/session.service";
import { LoggingService } from "../../../../logging/logging.service";
import { AuthService } from "../../auth.service";
import { CouchdbAuthService } from "../couchdb-auth.service";

/**
 * A simple password form that enforces secure password.
 */
@Component({
  selector: "app-password-form",
  templateUrl: "./password-form.component.html",
})
export class PasswordFormComponent implements OnInit {
  @Input() username: string;
  @Input() disabled = false;

  couchdbAuthService: CouchdbAuthService;

  passwordChangeResult: { success: boolean; error?: any };

  passwordForm = this.fb.group(
    {
      currentPassword: ["", Validators.required],
      newPassword: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[a-z]/),
          Validators.pattern(/\d/),
          Validators.pattern(/[^A-Za-z0-9]/),
        ],
      ],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: () => this.passwordMatchValidator() }
  );

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private loggingService: LoggingService,
    authService: AuthService
  ) {
    if (authService instanceof CouchdbAuthService) {
      this.couchdbAuthService = authService;
    }
  }

  ngOnInit() {
    if (this.disabled) {
      this.passwordForm.disable();
    }
  }

  changePassword(): Promise<any> {
    this.passwordChangeResult = undefined;

    const currentPassword = this.passwordForm.get("currentPassword").value;

    if (!this.sessionService.checkPassword(this.username, currentPassword)) {
      this.passwordForm
        .get("currentPassword")
        .setErrors({ incorrectPassword: true });
      return Promise.reject();
    }

    if (this.passwordForm.invalid) {
      return Promise.reject();
    }

    const newPassword = this.passwordForm.get("newPassword").value;
    return this.couchdbAuthService
      .changePassword(this.username, currentPassword, newPassword)
      .then(() => this.sessionService.login(this.username, newPassword))
      .then(() => (this.passwordChangeResult = { success: true }))
      .catch((err: Error) => {
        this.passwordChangeResult = { success: false, error: err.message };
        this.loggingService.error({
          error: "password change failed",
          details: err.message,
        });
        // rethrow to properly report to sentry.io; this exception is not expected, only caught to display in UI
        throw err;
      });
  }

  private passwordMatchValidator(): ValidationErrors | null {
    const newPassword = this.passwordForm?.get("newPassword").value;
    const confirmPassword = this.passwordForm?.get("confirmPassword").value;
    if (newPassword !== confirmPassword) {
      this.passwordForm
        .get("confirmPassword")
        .setErrors({ passwordConfirmationMismatch: true });
      return { passwordConfirmationMismatch: true };
    }
    return null;
  }
}
