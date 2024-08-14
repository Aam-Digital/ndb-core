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
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { AccountPageComponent } from "../../session/auth/keycloak/account-page/account-page.component";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { AsyncPipe, NgIf } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { SessionSubject } from "../../session/auth/session-info";

/**
 * User account form to allow the user to view and edit information.
 */
@Component({
  selector: "app-user-account",
  templateUrl: "./user-account.component.html",
  styleUrls: ["./user-account.component.scss"],
  imports: [
    MatTabsModule,
    TabStateModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    AccountPageComponent,
    AsyncPipe,
    EntityBlockComponent,
    NgIf,
  ],
  standalone: true,
})
export class UserAccountComponent implements OnInit {
  passwordChangeDisabled = false;
  tooltipText: string;

  constructor(
    protected currentUser: CurrentUserSubject,
    protected sessionInfo: SessionSubject,
  ) {}

  ngOnInit() {
    this.checkIfPasswordChangeAllowed();
  }

  checkIfPasswordChangeAllowed() {
    this.passwordChangeDisabled = false;
    this.tooltipText = "";

    if (environment.session_type !== SessionType.synced) {
      this.passwordChangeDisabled = true;
      this.tooltipText = $localize`:Password reset disabled tooltip:Password change is not allowed in demo mode.`;
    } else if (!navigator.onLine) {
      this.tooltipText = $localize`:Password reset disabled tooltip:Password change is not possible while being offline.`;
    }
  }
}
