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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotificationSettingsComponent } from "../../../features/notification/notification-settings/notification-settings.component";
import { UserDetailsComponent } from "../user-details/user-details.component";
import {
  Role,
  UserAccount,
} from "#src/app/core/user/user-admin-service/user-account";
import { SessionSubject } from "#src/app/core/session/auth/session-info";

/**
 * User profile page that allows the user to view and edit their own account information.
 * Displays user profile, password change options, and notification settings.
 */
@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule,
    TabStateModule,
    MatTooltipModule,
    UserDetailsComponent,
    NotificationSettingsComponent,
  ],
})
export class ProfileComponent {
  private readonly sessionInfo = inject(SessionSubject);

  userAccount = computed<UserAccount | null>(() => {
    if (!this.sessionInfo?.value) return null;

    const sessionRoles = this.sessionInfo.value.roles || [];

    let mappedRoles: Role[] = [];
    // create role objects from session role names because user may not have access to roles API
    mappedRoles = sessionRoles.map((roleName) => ({
      id: roleName,
      name: roleName,
      description: roleName,
    }));

    return {
      id: null,
      email: this.sessionInfo.value.email,
      enabled: true,
      roles: mappedRoles,
      userEntityId: this.sessionInfo.value.entityId,
    } as UserAccount;
  });
}
