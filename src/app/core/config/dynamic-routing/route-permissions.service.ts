import { Injectable, inject } from "@angular/core";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import { AbstractPermissionGuard } from "../../permissions/permission-guard/abstract-permission.guard";
import { MenuItem } from "../../ui/navigation/menu-item";

/**
 * Service that checks permissions for routes.
 */
@Injectable({
  providedIn: "root",
})
export class RoutePermissionsService {
  private readonly roleGuard = inject(UserRoleGuard);
  private readonly permissionGuard = inject(EntityPermissionGuard);

  /**
   * Feature Modules can register additional custom guards
   * as a multi provider for `AbstractPermissionGuard`.
   */
  private readonly additionalGuards =
    (inject(AbstractPermissionGuard, { optional: true }) as unknown as
      | AbstractPermissionGuard[]
      | null) ?? [];

  /**
   * Filters menu items based on the route and entity permissions on the link.
   */
  async filterPermittedRoutes(items: MenuItem[]): Promise<MenuItem[]> {
    const accessibleRoutes: MenuItem[] = [];

    for (const item of items) {
      if (!item.link) {
        // Link-less parent section header: only include if it has accessible children.
        // A link-less item with no children has no navigation purpose in the live menu.
        if (item.subMenu?.length) {
          const accessibleSubItems: MenuItem[] =
            await this.filterPermittedRoutes(item.subMenu);
          if (accessibleSubItems.length > 0) {
            accessibleRoutes.push({
              ...item,
              subMenu: accessibleSubItems,
            });
          }
        }
      } else if (await this.isAccessibleRouteForUser(item.link)) {
        accessibleRoutes.push(item);
      } else if (item.subMenu) {
        const accessibleSubItems: MenuItem[] = await this.filterPermittedRoutes(
          item.subMenu,
        );

        if (accessibleSubItems.length > 0) {
          // only adding the item if there is at least one accessible subMenu item
          const filteredParentItem: MenuItem = Object.assign({}, item);
          filteredParentItem.subMenu = accessibleSubItems;
          accessibleRoutes.push(filteredParentItem);
        }
      }
    }

    return accessibleRoutes;
  }

  private async isAccessibleRouteForUser(path: string): Promise<boolean> {
    const checks = [
      this.roleGuard.checkRoutePermissions(path),
      this.permissionGuard.checkRoutePermissions(path),
      ...this.additionalGuards.map((g) => g.checkRoutePermissions(path)),
    ];
    return (await Promise.all(checks)).every(Boolean);
  }
}
