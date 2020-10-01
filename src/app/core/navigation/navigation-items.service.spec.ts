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

import { NavigationItemsService } from "./navigation-items.service";
import { MenuItem } from "./menu-item";
import { ConfigService } from "../config/config.service";

describe("NavigationItemsService", () => {
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue({ items: [] });
  });

  it("adds menu item", function () {
    const navigationItemsService = new NavigationItemsService(
      mockConfigService
    );
    const item = new MenuItem("test", "child", ["/"]);

    navigationItemsService.addMenuItem(item);

    const items = navigationItemsService.getMenuItems();

    expect(items).toBeDefined();
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(item);
  });

  it("generates menu items from config", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };

    mockConfigService.getConfig.and.returnValue(testConfig);
    const navigationItemsService = new NavigationItemsService(
      mockConfigService
    );

    const items = navigationItemsService.getMenuItems();

    expect(items).toEqual([
      new MenuItem("Dashboard", "home", ["/dashboard"]),
      new MenuItem("Children", "child", ["/child"]),
    ]);
  });

  it("marks items that require admin rights", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };

    mockConfigService.getConfig.and.callFake((id) => {
      switch (id) {
        case ConfigService.PREFIX_VIEW_CONFIG + testConfig.items[0].link:
          return { requiresAdmin: true } as any;
        case ConfigService.PREFIX_VIEW_CONFIG + testConfig.items[1].link:
          return { requiresAdmin: false } as any;
        default:
          return testConfig;
      }
    });
    const navigationItemsService = new NavigationItemsService(
      mockConfigService
    );

    const items = navigationItemsService.getMenuItems();

    expect(items).toEqual([
      new MenuItem("Dashboard", "home", ["/dashboard"], true),
      new MenuItem("Children", "child", ["/child"], false),
    ]);
  });
});
