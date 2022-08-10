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

import { Component, OnInit, Optional } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { RemoteSession } from "../../session/session-service/remote-session";

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
    @Optional() public remoteSession: RemoteSession
  ) {}

  ngOnInit() {
    this.checkIfPasswordChangeAllowed();
    this.username = this.sessionService.getCurrentUser()?.name;
  }

  checkIfPasswordChangeAllowed() {
    this.disabledForDemoMode = false;
    this.disabledForOfflineMode = false;

    if (!this.remoteSession) {
      this.disabledForDemoMode = true;
    } else if (!navigator.onLine) {
      this.disabledForOfflineMode = true;
    }
  }

  getPasswordResetDisabledTooltip(): string {
    return this.disabledForDemoMode
      ? $localize`:Password reset disabled tooltip:Password change is not allowed in demo mode.`
      : this.disabledForOfflineMode
      ? $localize`:Password reset disabled tooltip:Password change is not possible while being offline.`
      : "";
  }
}
