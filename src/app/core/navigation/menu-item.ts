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

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faDynamicIcons } from "../view/dynamic-components/fa-dynamic-icons";

/**
 * Structure for menu items to be displayed.
 */
export class MenuItem {
  static fromConfigItems(configItems: object[]): MenuItem[] {
    return configItems.map((o) => {
      if (o["name"]) {
        return new MenuItem(o["name"], o["icon"], o["link"]);
      } else {
        return new MenuItem(o["label"], o["icon"], o["link"]);
      }
    });
  }

  faIcon: IconDefinition;
  /**
   * Create a menu item.
   * @param label The text to be displayed in the menu.
   * @param icon The icon to be displayed left of the label.
   * @param link The url fragment to which the item will route to (e.g. '/dashboard')
   */
  constructor(public label: string, icon: string, public link: string) {
    this.faIcon = faDynamicIcons.get(icon);
  }
}
