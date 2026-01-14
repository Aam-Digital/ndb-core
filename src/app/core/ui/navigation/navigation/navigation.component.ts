import { Component, inject, signal } from "@angular/core";
import { MenuItem } from "../menu-item";
import { UntilDestroy } from "@ngneat/until-destroy";
import { NavigationEnd, Router } from "@angular/router";
import { filter, startWith } from "rxjs/operators";
import { MatListModule } from "@angular/material/list";
import { Angulartics2Module } from "angulartics2";
import { RoutePermissionsService } from "../../../config/dynamic-routing/route-permissions.service";
import { MatMenuModule } from "@angular/material/menu";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuService } from "../menu.service";

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
    Angulartics2Module,
    MatMenuModule,
    MenuItemComponent,
  ],
})
export class NavigationComponent {
  private menuService = inject(MenuService);
  private router = inject(Router);
  private routePermissionService = inject(RoutePermissionsService);

  /** The menu-item link (not the actual router link) that is currently active */
  activeLink = signal<string>("");

  /** all menu items to be displayed */
  public menuItems = signal<MenuItem[]>([]);

  constructor() {
    // subscribe to menu items from the menu service
    this.menuService.menuItems.subscribe(async (menuItems) => {
      const filtered =
        await this.routePermissionService.filterPermittedRoutes(menuItems);
      this.menuItems.set(filtered);

      // re-select active menu item after menu has been fully initialized
      this.activeLink.set(this.computeActiveLink(location.pathname));
    });

    this.router.events
      .pipe(
        startWith(new NavigationEnd(0, this.router.url, "")),
        filter((event) => event instanceof NavigationEnd),
      )
      .subscribe((event: NavigationEnd) => {
        this.activeLink.set(this.computeActiveLink(event.url));
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
    const items: MenuItem[] = this.menuItems()
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
}
