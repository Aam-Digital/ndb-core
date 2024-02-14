import {
  ActivatedRouteSnapshot,
  CanActivate,
  Route,
  Router,
} from "@angular/router";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

/**
 * Abstract base class with functionality common to all guards that check configurable user permissions or roles.
 */
export abstract class AbstractPermissionGuard implements CanActivate {
  constructor(private router: Router) {}

  /**
   * Check if current navigation is allowed. This is used by Angular Router.
   * @param route
   */
  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const routeData: DynamicComponentConfig = route.data;
    if (await this.canAccessRoute(routeData)) {
      return true;
    } else {
      if (route instanceof ActivatedRouteSnapshot) {
        // Route should only change if this is a "real" navigation check (not the check in the NavigationComponent)
        this.router.navigate(["/404"]);
      }
      return false;
    }
  }

  /**
   * Implement specific permission checks here, based on the given route data (from config)
   * and any required services provided by Angular dependency injection.
   *
   * @param routeData The route data object defined either in routing code or loaded from config by the RouterService.
   * @protected
   */
  protected abstract canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean>;

  /**
   * Pre-check if access to the given route would be allowed.
   * This is used by components and services to evaluate permissions without actual navigation.
   *
   * @param path
   */
  public checkRoutePermissions(path: string) {
    let routeData = this.getRouteDataFromRouter(path, this.router.config);
    return this.canAccessRoute(routeData?.data);
  }

  /**
   * Extract the relevant route from Router, to get a merged route that contains the full trail of `permittedRoles`
   * @param path
   * @param routes
   * @private
   */
  private getRouteDataFromRouter(path: string, routes: Route[]) {
    // removing leading slash
    path = path.replace(/^\//, "");

    function isPathMatch(genericPath: string, path: string) {
      const routeRegex = genericPath
        .replace(/\*/g, ".*") // allow for wildcard routes in regex
        .split("/")
        // replace params with wildcard regex
        .map((part) => (part.startsWith(":") ? "[^/]*" : part))
        .join("/");
      return path.match("^" + routeRegex + "[/.*]*$");
    }

    const pathSections = path.split("/");
    let route = routes.find((r) => isPathMatch(r.path, path));
    if (!route && pathSections.length > 1) {
      route = routes.find((r) => isPathMatch(r.path, pathSections[0]));
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
