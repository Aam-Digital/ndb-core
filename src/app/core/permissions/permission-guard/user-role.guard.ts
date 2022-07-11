import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { SessionService } from "../../session/session-service/session.service";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { DatabaseUser } from "../../session/session-service/local-user";

/**
 * A guard that checks the roles of the current user against the permissions which are saved in the route data.
 */
@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private sessionService: SessionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routeData: RouteData = route.data;
    const user = this.sessionService.getCurrentUser();
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

  private canAccessRoute(permittedRoles: string[], user: DatabaseUser) {
    if (permittedRoles?.length > 0) {
      // Check if user has a role which is in the list of permitted roles
      return permittedRoles.some((role) => user?.roles.includes(role));
    } else {
      // No config set => all users are allowed
      return true;
    }
  }
}
