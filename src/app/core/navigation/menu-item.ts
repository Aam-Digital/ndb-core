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

/**
 * Structure for menu items to be displayed.
 *
 * also see {@link NavigationItemsService}
 */
export class MenuItem {
  /**
   * Create a menu item.
   * @param label The text to be displayed in the menu.
   * @param icon The icon to be displayed left of the label.
   * @param routerLinkParameters The Angular routerLink parameters to which the item will route to (e.g. ['/dashboard'])
   * @param requiresAdmin Whether the menu item is only visible for users with admin rights.
   */
  constructor(public label: string,
              public icon: string,
              public routerLinkParameters: any[],
              public requiresAdmin: boolean = false) {
  }
}
