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
import { AppConfig } from "../../app-config/app-config";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { UserAccountService } from "./user-account.service";
import { LoginState } from "../../session/session-states/login-state.enum";
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";

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
  webdavEnabled = !!AppConfig.settings.webdav;

  passwordChangeDisabled = AppConfig.settings.database.useTemporaryDatabase;
  passwordPattern =
    "^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=\\D*\\d)[A-Za-z\\d!$%@#£€*?&]{8,}$";
  passwordErrorMessage = "";

  passwordForm = this.fb.group({
    currentPassword: ["", Validators.required],
    newPassword: this.fb.group(
      {
        newPassword: [
          "",
          [Validators.required, Validators.pattern(this.passwordPattern)],
        ],
        confirmPassword: ["", [Validators.required]],
      },
      { validator: this.passwordMathValidator }
    ),
  });

  constructor(
    private entityMapperService: EntityMapperService,
    private sessionService: SessionService,
    private userAccountService: UserAccountService,
    private fb: FormBuilder
  ) {
    if (AppConfig.settings.database.useTemporaryDatabase) {
      this.passwordForm.disable();
    }
  }

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
  }

  /**
   * Change the user's password.
   *
   * @param oldPwd The current password
   * @param newPwd New password
   * @param rePwd Confirmation of the new password
   */
  changePassword(oldPwd, newPwd, rePwd) {
    this.userAccountService
      .changePassword(this.user, oldPwd, newPwd)
      .then((res) => {
        console.log("done", res);
        return this.sessionService
          .login(this.user.name, newPwd)
          .then((newState) => console.log("login", LoginState[newState]));
      })
      .catch((err) => (this.passwordErrorMessage = err));
  }

  private passwordMathValidator(group: FormGroup): ValidationErrors | null {
    const newPassword: string = group.get("newPassword").value;
    const confirmPassword: string = group.get("confirmPassword").value;
    if (newPassword !== confirmPassword) {
      return { confirm: true };
    }
    return null;
  }
}
