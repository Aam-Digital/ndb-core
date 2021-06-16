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
import { NavigationEnd, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { filter, map, startWith } from "rxjs/operators";

/**
 * Main app menu listing.
 */
@Component({
  selector: "app-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"],
})
@UntilDestroy()
export class NavigationComponent {
  activeElement: string;
  /** name of config array in the config json file */
  private readonly CONFIG_ID = "navigationMenu";
  /** all menu items to be displayed */
  public menuItems: MenuItem[] = [];

  constructor(
    private adminGuard: AdminGuard,
    private configService: ConfigService,
    private router: Router
  ) {
    this.configService.configUpdated.subscribe(() =>
      this.initMenuItemsFromConfig()
    );
    this.router.events
      .pipe(
        startWith(new NavigationEnd(0, this.router.url, "")),
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) =>
          // conservative filter matching all items that could fit to the given url
          this.menuItems.filter((item) => event.url.startsWith(item.link))
        )
      )
      .subscribe((items) => {
        if (items.length === 0) {
          this.activeElement = "";
        } else if (items.length === 1) {
          this.activeElement = items[0].name;
        } else {
          // If there are multiple matches (A user navigates with a URL that starts with
          // multiple links from a MenuItem), use the element where the length is bigger.
          //
          // For example: Let there be two possible routes: '/attendance' and '/attendance/add/day'.
          // When a user navigates to the URL '/attendance', only '/attendance' is
          // a prefix of the possible '/attendance'. The potential other candidate '/attendance/add/day'
          // is not a prefix of '/attendance' and there is no ambiguity.
          //
          // Vice Versa, when navigated to '/attendance/add/day',
          // both '/attendance' and '/attendance/add/day' are a prefix of '/attendance/add/day'.
          // In the latter case, the one with the longer URL should match.
          this.activeElement = items.reduce((i1, i2) =>
            i1.link.length > i2.link.length ? i1 : i2
          ).name;
        }
      });
  }

  /**
   * Load menu items from config file
   */
  private initMenuItemsFromConfig() {
    const config = this.configService.getConfig<NavigationMenuConfig>(
      this.CONFIG_ID
    );
    this.menuItems = config.items.filter((item) =>
      this.currentUserHasPermissionsFor(item)
    );
  }

  /**
   * Check whether the user has the required rights
   */
  private currentUserHasPermissionsFor(item: MenuItem): boolean {
    const viewConfig = this.configService.getConfig<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG + item.link.replace(/^\//, "")
    );
    return !viewConfig?.requiresAdmin || this.adminGuard.isAdmin();
  }
}
