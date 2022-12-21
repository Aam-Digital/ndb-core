import { Injectable } from "@angular/core";
import { Route, Router } from "@angular/router";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import {
  PREFIX_VIEW_CONFIG,
  RouteData,
  ViewConfig,
} from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { RouteRegistry } from "../../../app.routing";
import { NotFoundComponent } from "./not-found/not-found.component";
import { AuthGuard } from "../../session/auth.guard";

/**
 * The RouterService dynamically sets up Angular routing from config loaded through the {@link ConfigService}.
 *
 * You can define {@link ViewConfig} objects in the central configuration and build the routing at runtime
 * rather than hard-coding the available paths and settings.
 */
@Injectable({
  providedIn: "root",
})
export class RouterService {
  constructor(
    private configService: ConfigService,
    private router: Router,
    private loggingService: LoggingService,
    private registry: RouteRegistry
  ) {}

  /**
   * Initialize routes from the config while respecting existing routes.
   */
  initRouting() {
    const viewConfigs =
      this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);
    this.reloadRouting(viewConfigs, this.router.config);
  }

  /**
   * Reset the routing config and reload it from the global config.
   *
   * @param viewConfigs The configs loaded from the ConfigService
   * @param additionalRoutes Optional array of routes to keep in addition to the ones loaded from config
   */
  reloadRouting(viewConfigs: ViewConfig[], additionalRoutes: Route[] = []) {
    const routes: Route[] = [];

    for (const view of viewConfigs) {
      try {
        routes.push(this.createRoute(view, additionalRoutes));
      } catch (e) {
        this.loggingService.warn(
          `Failed to create route for view ${view._id}: ${e.message}`
        );
      }
    }

    // add routes from other sources (e.g. pre-existing  hard-coded routes)
    const noDuplicates = additionalRoutes.filter(
      (r) => !routes.find((o) => o.path === r.path)
    );

    // change wildcard route to show not-found component instead of empty page
    const wildcardRoute = noDuplicates.find((route) => route.path === "**");
    if (wildcardRoute) {
      wildcardRoute.component = NotFoundComponent;
    }

    routes.push(...noDuplicates);

    this.router.resetConfig(routes);
  }

  private createRoute(view: ViewConfig, additionalRoutes: Route[]) {
    if (view.lazyLoaded) {
      const path = view._id.substring(PREFIX_VIEW_CONFIG.length);
      const route = additionalRoutes.find((r) => r.path === path);
      return this.generateRouteFromConfig(view, route);
    } else {
      return this.generateRouteFromConfig(view);
    }
  }

  private generateRouteFromConfig(
    view: ViewConfig,
    route: Route = {
      path: view._id.substring(PREFIX_VIEW_CONFIG.length),
      component: this.registry.get(view.component),
    }
  ): Route {
    const routeData: RouteData = {};
    route.canActivate = [AuthGuard];

    if (view.permittedUserRoles) {
      route.canActivate.push(UserRoleGuard);
      routeData.permittedUserRoles = view.permittedUserRoles;
    }

    if (view.config) {
      routeData.config = view.config;
    }

    route.data = routeData;
    return route;
  }
}
