import { Injectable } from "@angular/core";
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
  constructor(
    private roleGuard: UserRoleGuard,
    private permissionGuard: EntityPermissionGuard,
  ) {}

  /**
   * Filters menu items based on the route and entity permissions on the link.
   */
  async filterPermittedRoutes(items: MenuItem[]): Promise<MenuItem[]> {
    const accessibleRoutes: MenuItem[] = [];
    for (const item of items) {
      if (await this.isAccessibleRouteForUser(item.link)) {
        accessibleRoutes.push(item);
      }
    }
    return accessibleRoutes;
  }

  private isAccessibleRouteForUser(path: string) {
    return (
      this.roleGuard.checkRoutePermissions(path) &&
      this.permissionGuard.checkRoutePermissions(path)
    );
  }
}
