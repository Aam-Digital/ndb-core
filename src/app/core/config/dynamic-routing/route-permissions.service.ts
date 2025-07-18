import { Injectable, inject } from "@angular/core";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import { MenuItem } from "../../ui/navigation/menu-item";

/**
 * Service that checks permissions for routes.
 */
@Injectable({
  providedIn: "root",
})
export class RoutePermissionsService {
  private roleGuard = inject(UserRoleGuard);
  private permissionGuard = inject(EntityPermissionGuard);

  /**
   * Filters menu items based on the route and entity permissions on the link.
   */
  async filterPermittedRoutes(items: MenuItem[]): Promise<MenuItem[]> {
    const accessibleRoutes: MenuItem[] = [];

    for (const item of items) {
      if (item.link && (await this.isAccessibleRouteForUser(item.link))) {
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
    return (
      (await this.roleGuard.checkRoutePermissions(path)) &&
      (await this.permissionGuard.checkRoutePermissions(path))
    );
  }
}
