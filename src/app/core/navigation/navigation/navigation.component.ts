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
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SessionService } from "../../session/session-service/session.service";
import { NavigationEnd, Router } from "@angular/router";
import { filter, startWith } from "rxjs/operators";

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
  /** The menu-item link (not the actual router link) that is currently active */
  activeLink: string;
  /** name of config array in the config json file */
  private readonly CONFIG_ID = "navigationMenu";
  /** all menu items to be displayed */
  public menuItems: MenuItem[] = [];

  constructor(
    private userRoleGuard: UserRoleGuard,
    private configService: ConfigService,
    private session: SessionService,
    private router: Router
  ) {
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initMenuItemsFromConfig());
    this.router.events
      .pipe(
        startWith(new NavigationEnd(0, this.router.url, "")),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeLink = this.computeActiveLink(event.url);
      });
  }

  /**
   * Computes the active link from a set of MenuItems.
   * The active link is the link with the most "overlap", i.e.
   * the most specific link that can be found given the array.
   * @param newUrl The new url for which the navigation item should be highlighted
   * @return the most specific link
   * @private
   */
  private computeActiveLink(newUrl: string): string {
    // conservative filter matching all items that could fit to the given url
    const items: MenuItem[] = this.menuItems.filter((item) =>
      newUrl.startsWith(item.link)
    );
    switch (items.length) {
      case 0:
        return "";
      case 1:
        const link = items[0].link;
        // for root "/" only return on exact match to avoid confusing highlighting of unrelated items
        return newUrl === link || link.length > 1 ? link : "";
      default:
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
        return items.reduce((i1, i2) =>
          i1.link.length > i2.link.length ? i1 : i2
        ).link;
    }
  }

  /**
   * Load menu items from config file
   */
  private initMenuItemsFromConfig() {
    this.menuItems = [];
    const config: NavigationMenuConfig =
      this.configService.getConfig<NavigationMenuConfig>(this.CONFIG_ID);
    for (const configItem of config.items) {
      if (this.userRoleGuard.checkRoutePermissions(configItem.link)) {
        this.menuItems.push(
          new MenuItem(configItem.name, configItem.icon, configItem.link)
        );
      }
    }
  }

  logout() {
    this.session.logout();
  }
}
