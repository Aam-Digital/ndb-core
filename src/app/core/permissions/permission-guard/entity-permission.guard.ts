import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { RouteData } from "../../config/dynamic-routing/view-config.interface";
import { EntityAbility } from "../ability/entity-ability";

/**
 * A guard that checks the current users permission to interact with the entity of the route.
 * Define `requiredPermissionOperation` in the route data / config, to enable a check that will find the relevant entity from config.
 */
@Injectable()
export class EntityPermissionGuard implements CanActivate {
  constructor(
    private router: Router,
    private ability: EntityAbility,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routeData: RouteData = route.data;
    if (this.canAccessRoute(routeData)) {
      return true;
    } else {
      if (route instanceof ActivatedRouteSnapshot) {
        // Route should only change if this is a "real" navigation check (not the check in the NavigationComponent)
        this.router.navigate(["/404"]);
      }
      return false;
    }
  }

  private canAccessRoute(routeData) {
    const operation = routeData?.["requiredPermissionOperation"] ?? "read";
    const primaryEntity =
      routeData?.["entityType"] ??
      routeData?.["entity"] ??
      routeData?.["config"]?.["entityType"] ??
      routeData?.["config"]?.["entity"];

    if (!primaryEntity) {
      // No relevant config set => all users are allowed
      return true;
    }

    return this.ability.can(operation, primaryEntity);
  }
}
