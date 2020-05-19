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
import { MenuItem } from "./menu-item";

/**
 * Manage menu items to be displayed in the main app menu.
 *
 * Inject this service in your classes to add your own custom menu entries.
 */
@Injectable()
export class NavigationItemsService {
  private menuItems: MenuItem[] = [];

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
