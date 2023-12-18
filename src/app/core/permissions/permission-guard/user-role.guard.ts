import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Route,
  Router,
} from "@angular/router";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../../config/dynamic-routing/view-config.interface";
import { AuthUser } from "../../session/auth/auth-user";
import { ConfigService } from "../../config/config.service";
import { CurrentUserSubject } from "../../user/user";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

/**
 * A guard that checks the roles of the current user against the permissions which are saved in the route data.
 */
@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private currentUser: CurrentUserSubject,
    private router: Router,
    private configService: ConfigService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routeData: DynamicComponentConfig = route.data;
    const user = this.currentUser.value;
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
    // removing leading slash
    path = path.replace(/^\//, "");

    let viewConfig = this.getRouteConfig(path);

    if (!viewConfig) {
      // search for details route ("path/:id" for any id)
      const detailsPath = path.replace(/\/[^\/]*$/, "/:id");
      viewConfig = this.getRouteConfig(detailsPath);
    }

    return this.canActivate({
      routeConfig: { path: path },
      data: { permittedUserRoles: viewConfig?.permittedUserRoles },
    } as any);
  }

  /**
   * Find the relevant ViewConfig from config or already registered routes
   * @param path
   * @private
   */
  private getRouteConfig(path: string): ViewConfig {
    const viewConfig = this.configService.getConfig<ViewConfig>(
      PREFIX_VIEW_CONFIG + path,
    );
    if (viewConfig) {
      return viewConfig;
    }

    let route = this.getRouteDataFromRouter(path, this.router.config);
    return route?.data as ViewConfig;
  }

  /**
   * Extract the relevant route from Router, to get a merged route that contains the full trail of `permittedRoles`
   * @param path
   * @param routes
   * @private
   */
  private getRouteDataFromRouter(path: string, routes: Route[]) {
    const pathSections = path.split("/");
    let route = routes.find((r) => r.path === path);
    if (!route && pathSections.length > 1) {
      route = routes.find((r) => r.path === pathSections[0]);
    }

    if (route?.children) {
      const childRoute = this.getRouteDataFromRouter(
        pathSections.slice(1).join("/"),
        route.children,
      );
      if (childRoute) {
        childRoute.data = { ...route.data, ...childRoute?.data };
        route = childRoute;
      }
    }

    return route;
  }
}
