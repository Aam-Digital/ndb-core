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
import { AdminGuard } from "../../admin/admin.guard";
import { NavigationMenuConfig } from "../navigation-menu-config.interface";
import { RouterService } from "../../view/dynamic-routing/router.service";
import { ViewConfig } from "../../view/dynamic-routing/view-config.interface";
import { ConfigService } from "../../config/config.service";

/**
 * Main app menu listing.
 */
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
    private adminGuard: AdminGuard,
    private configService: ConfigService
  ) {
    this.configService.configUpdated.subscribe(() =>
      this.initMenuItemsFromConfig()
    );
  }

  /**
   * Load menu items from config file
   */
  private initMenuItemsFromConfig() {
    this.menuItems = [];
    const config: NavigationMenuConfig =
      this.configService.getConfig<NavigationMenuConfig>(this.CONFIG_ID);
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
    const viewConfig = this.configService.getConfig<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG + link.replace(/^\//, "")
    );
    return !viewConfig?.requiresAdmin || this.adminGuard.isAdmin();
  }
}
