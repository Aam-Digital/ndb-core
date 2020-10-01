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

import { Injectable } from "@angular/core";
import { ConfigService } from "../config/config.service";
import { MenuItem } from "./menu-item";
import { NavigationMenuConfig } from "./navigation-menu-config.interface";

/**
 * Manage menu items to be displayed in the main app menu.
 *
 * Inject this service in your classes to add your own custom menu entries.
 */
@Injectable()
export class NavigationItemsService {
  private readonly CONFIG_ID = "navigationMenu";
  private menuItems: MenuItem[] = [];

  constructor(private configService: ConfigService) {
    this.initMenuItemsFromConfig();
  }

  private initMenuItemsFromConfig() {
    const config: NavigationMenuConfig = this.configService.getConfig<
      NavigationMenuConfig
    >(this.CONFIG_ID);
    for (const configItem of config.items) {
      this.addMenuItem(
        new MenuItem(
          configItem.name,
          configItem.icon,
          [configItem.link],
          this.checkMenuItemPermissions(configItem.link)
        )
      );
    }
  }

  /**
   * Check whether the given path requires admin rights
   */
  private checkMenuItemPermissions(link: string): boolean {
    const viewConfig = this.configService.getConfig<any>(
      ConfigService.PREFIX_VIEW_CONFIG + link
    );
    return viewConfig?.requiresAdmin;
  }

  /**
   * Get all registered menu items.
   */
  public getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  /**
   * Register a new menu item to be display in the menu.
   * @param menuItem
   */
  public addMenuItem(menuItem: MenuItem) {
    this.menuItems.push(menuItem);
  }
}
