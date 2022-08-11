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
import { SessionService } from "../../session/session-service/session.service";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";
import { AuthService } from "../../session/auth/auth.service";

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
  username: string;

  /** whether password change is disallowed because of demo mode */
  disabledForDemoMode: boolean;
  disabledForOfflineMode: boolean;

  constructor(
    private sessionService: SessionService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.checkIfPasswordChangeAllowed();
    this.username = this.sessionService.getCurrentUser()?.name;
  }

  checkIfPasswordChangeAllowed() {
    this.disabledForDemoMode = false;
    this.disabledForOfflineMode = false;

    if (environment.session_type !== SessionType.synced) {
      this.disabledForDemoMode = true;
    } else if (!navigator.onLine) {
      this.disabledForOfflineMode = true;
    }
  }

  getPasswordResetDisabledTooltip(): string {
    if (this.disabledForDemoMode) {
      return $localize`:Password reset disabled tooltip:Password change is not allowed in demo mode.`;
    } else if (this.disabledForOfflineMode) {
      return $localize`:Password reset disabled tooltip:Password change is not possible while being offline.`;
    } else {
      return "";
    }
  }
}
