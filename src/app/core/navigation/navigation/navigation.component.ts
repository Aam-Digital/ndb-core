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

import { Component } from "@angular/core";
import { MenuItem } from "../menu-item";
import { NavigationMenuConfig } from "../navigation-menu-config.interface";
import { ConfigService } from "../../config/config.service";
import { UserRoleGuard } from "../../permissions/user-role.guard";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../../view/dynamic-routing/view-config.interface";
import { UserAccountService } from "../../user/user-account/user-account.service";
import { SessionService } from "../../session/session-service/session.service";

/**
 * Main app menu listing.
 */
@UntilDestroy()
@Component({
  selector: "app-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"],
})
export class NavigationComponent {
  /** name of config array in the config json file */
  private readonly CONFIG_ID = "navigationMenu";
  /** all menu items to be displayed */
  public menuItems: MenuItem[] = [];

  constructor(
    private userRoleGuard: UserRoleGuard,
    private configService: ConfigService,
    private session: SessionService
  ) {
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initMenuItemsFromConfig());
  }

  /**
   * Load menu items from config file
   */
  private initMenuItemsFromConfig() {
    this.menuItems = [];
    const config: NavigationMenuConfig = this.configService.getConfig<NavigationMenuConfig>(
      this.CONFIG_ID
    );
    for (const configItem of config.items) {
      if (this.checkMenuItemPermissions(configItem.link)) {
        this.menuItems.push(
          new MenuItem(configItem.name, configItem.icon, configItem.link)
        );
      }
    }
  }

  /**
   * Check whether the user has the required rights
   */
  private checkMenuItemPermissions(link: string): boolean {
    const configPath = link.replace(/^\//, "");
    const userRoles = this.configService.getConfig<ViewConfig>(
      PREFIX_VIEW_CONFIG + configPath
    )?.permittedUserRoles;
    return this.userRoleGuard.canActivate({
      routeConfig: { path: configPath },
      data: { permittedUserRoles: userRoles },
    } as any);
  }

  logout() {
    this.session.logout();
  }
}
