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
      if (await this.isAccessibleRouteForUser(item.target as string)) {
        accessibleRoutes.push(item);
      }
    }
    return accessibleRoutes;
  }

  private async isAccessibleRouteForUser(path: string) {
    return (
      (await this.roleGuard.checkRoutePermissions(path)) &&
      (await this.permissionGuard.checkRoutePermissions(path))
    );
  }
}
