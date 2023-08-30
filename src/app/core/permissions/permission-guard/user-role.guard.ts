import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import {
  PREFIX_VIEW_CONFIG,
  RouteData,
  ViewConfig,
} from "../../config/dynamic-routing/view-config.interface";
import { AuthUser } from "../../session/session-service/auth-user";
import { ConfigService } from "../../config/config.service";
import { UserService } from "../../user/user.service";

/**
 * A guard that checks the roles of the current user against the permissions which are saved in the route data.
 */
@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router,
    private configService: ConfigService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routeData: RouteData = route.data;
    const user = this.userService.getCurrentUser();
    if (this.canAccessRoute(routeData?.permittedUserRoles, user)) {
      return true;
    } else {
      if (route instanceof ActivatedRouteSnapshot) {
        // Route should only change if this is a "real" navigation check (not the check in the NavigationComponent)
        this.router.navigate(["/404"]);
      }
      return false;
    }
  }

  private canAccessRoute(permittedRoles: string[], user: AuthUser) {
    if (permittedRoles?.length > 0) {
      // Check if user has a role which is in the list of permitted roles
      return permittedRoles.some((role) => user?.roles.includes(role));
    } else {
      // No config set => all users are allowed
      return true;
    }
  }

  public checkRoutePermissions(path: string) {
    path = path.replace(/^\//, "");
    const userRoles = this.configService.getConfig<ViewConfig>(
      PREFIX_VIEW_CONFIG + path,
    )?.permittedUserRoles;
    return this.canActivate({
      routeConfig: { path: path },
      data: { permittedUserRoles: userRoles },
    } as any);
  }
}
