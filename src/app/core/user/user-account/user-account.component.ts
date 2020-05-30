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
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { AppConfig } from "../../app-config/app-config";

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

  constructor(
    private entityMapperService: EntityMapperService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
  }

  /**
   * Change the user's password.
   *
   * @todo This is not implemented yet!
   *
   * @param pwd New password to be set
   * @param rpwd Confirmation of new password (second input by the user to prevent typos)
   */
  changePassword(pwd, rpwd) {
    if (pwd === rpwd) {
      // TODO: update the password for this remote database user first and deny the password change if that fails
      this.user.setNewPassword(pwd);
      // TODO: Show success message
    } else {
      // TODO: Show error message
    }
  }
}
