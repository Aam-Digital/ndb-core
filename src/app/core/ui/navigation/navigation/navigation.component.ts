import { Component, inject } from "@angular/core";
import { EntityMenuItem, MenuItem, NavigationMenuConfig } from "../menu-item";
import { ConfigService } from "../../../config/config.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NavigationEnd, Router } from "@angular/router";
import { filter, startWith } from "rxjs/operators";
import { MatListModule } from "@angular/material/list";
import { CommonModule, NgForOf } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { RoutePermissionsService } from "../../../config/dynamic-routing/route-permissions.service";
import { MatMenuModule } from "@angular/material/menu";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";

/**
 * Main app menu listing.
 */
@UntilDestroy()
@Component({
  selector: "app-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"],
  imports: [
    MatListModule,
    NgForOf,
    Angulartics2Module,
    MatMenuModule,
    CommonModule,
    MenuItemComponent,
  ],
  standalone: true,
})
export class NavigationComponent {
  private entities = inject(EntityRegistry);

  /** The menu-item link (not the actual router link) that is currently active */
  activeLink: string;

  /** name of config array in the config json file */
  private readonly CONFIG_ID = "navigationMenu";

  /** all menu items to be displayed */
  public menuItems: MenuItem[] = [];

  constructor(
    private configService: ConfigService,
    private router: Router,
    private routePermissionService: RoutePermissionsService,
  ) {
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initMenuItemsFromConfig());
    this.router.events
      .pipe(
        startWith(new NavigationEnd(0, this.router.url, "")),
        filter((event) => event instanceof NavigationEnd),
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
    // flatten nested submenu items to parse all
    const items: MenuItem[] = this.menuItems
      .reduce((acc, item) => acc.concat(item, item.subMenu || []), [])
      .filter((item) => newUrl.startsWith(item.link));
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
          i1.link.length > i2.link.length ? i1 : i2,
        ).link;
    }
  }

  /**
   * Load menu items from config file
   */
  private async initMenuItemsFromConfig() {
    const config = this.configService.getConfig<NavigationMenuConfig>(
      this.CONFIG_ID,
    );

    const menuItems = config.items.map((item) =>
      this.generateMenuItemForEntityType(item),
    );

    this.menuItems =
      await this.routePermissionService.filterPermittedRoutes(menuItems);

    // re-select active menu item after menu has been fully initialized
    this.activeLink = this.computeActiveLink(location.pathname);
  }

  /**
   * parse special EntityMenuItem to regular item recursively
   * by looking up the entityType from EntityRegistry and then using its config.
   */
  private generateMenuItemForEntityType(item: MenuItem): MenuItem {
    if ("entityType" in item) {
      const entityType = this.entities.get((item as EntityMenuItem).entityType);
      return {
        label: entityType.labelPlural,
        icon: entityType.icon,
        link: entityType.route,
      };
    } else if (item.subMenu) {
      return {
        ...item,
        subMenu: item.subMenu.map((subItem) =>
          this.generateMenuItemForEntityType(subItem),
        ),
      };
    } else {
      return item;
    }
  }
}
