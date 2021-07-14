/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from "@angular/core";
import { User } from "../user";
import { SessionService } from "../../session/session-service/session.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { WebdavModule } from "../../webdav/webdav.module";
import { UserAccountService } from "./user-account.service";
import { FormBuilder, ValidationErrors, Validators } from "@angular/forms";
import { AppConfig } from "../../app-config/app-config";
import { LoggingService } from "../../logging/logging.service";
import { SessionType } from "../../session/session-type";

/**
 * User account form to allow the user to view and edit information.
 */
@Component({
  selector: "app-user-account",
  templateUrl: "./user-account.component.html",
  styleUrls: ["./user-account.component.scss"],
})
export class UserAccountComponent implements OnInit {
  /** user to be edited */
  user: User;

  /** whether webdav integration is configured and the cloud settings section should be displayed */
  webdavEnabled = WebdavModule.isEnabled;

  /** whether password change is disallowed because of demo mode */
  disabledForDemoMode: boolean;
  disabledForOfflineMode: boolean;

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
          Validators.pattern(/[0-9]/),
          Validators.pattern(/[^A-Za-z0-9]/),
        ],
      ],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: () => this.passwordMatchValidator() }
  );

  constructor(
    private entityMapperService: EntityMapperService,
    private sessionService: SessionService,
    private userAccountService: UserAccountService,
    private fb: FormBuilder,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.checkIfPasswordChangeAllowed();
    this.user = this.sessionService.getCurrentUser();
  }

  checkIfPasswordChangeAllowed() {
    this.disabledForDemoMode = false;
    this.disabledForOfflineMode = false;
    this.passwordForm.enable();

    if (AppConfig.settings.session_type !== SessionType.synced) {
      this.disabledForDemoMode = true;
      this.passwordForm.disable();
    } else if (!navigator.onLine) {
      this.disabledForOfflineMode = true;
      this.passwordForm.disable();
    }
  }

  changePassword() {
    this.passwordChangeResult = undefined;

    const currentPassword = this.passwordForm.get("currentPassword").value;
    if (!this.user.checkPassword(currentPassword)) {
      this.passwordForm
        .get("currentPassword")
        .setErrors({ incorrectPassword: true });
      return;
    }

    const newPassword = this.passwordForm.get("newPassword").value;
    this.userAccountService
      .changePassword(this.user, currentPassword, newPassword)
      .then(() => this.sessionService.login(this.user.name, newPassword))
      .then(() => {
        this.passwordChangeResult = { success: true };
      })
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
    const newPassword: string = this?.passwordForm?.get("newPassword")?.value;
    const confirmPassword: string =
      this?.passwordForm?.get("confirmPassword")?.value;
    if (newPassword !== confirmPassword) {
      this.passwordForm
        .get("confirmPassword")
        .setErrors({ passwordConfirmationMismatch: true });
      return { passwordConfirmationMismatch: true };
    }
    return null;
  }
}
