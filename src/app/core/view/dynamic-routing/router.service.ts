import { Injectable } from "@angular/core";
import { Route, Router } from "@angular/router";
import { COMPONENT_MAP } from "../../../app.routing";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import {
  PREFIX_VIEW_CONFIG,
  RouteData,
  ViewConfig,
} from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/user-role.guard";

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
    private loggingService: LoggingService
  ) {}

  /**
   * Initialize routes from the config while respecting existing routes.
   */
  initRouting() {
    const viewConfigs = this.configService.getAllConfigs<ViewConfig>(
      PREFIX_VIEW_CONFIG
    );
    this.reloadRouting(viewConfigs, this.router.config, true);
  }

  /**
   * Reset the routing config and reload it from the global config.
   *
   * @param viewConfigs The configs loaded from the ConfigService
   * @param additionalRoutes Optional array of routes to keep in addition to the ones loaded from config
   * @param overwriteExistingRoutes Optionally set to true if config was updated and previously existing routes shall be updated
   */
  reloadRouting(
    viewConfigs: ViewConfig[],
    additionalRoutes: Route[] = [],
    overwriteExistingRoutes = false
  ) {
    const routes: Route[] = [];

    for (const view of viewConfigs) {
      const route = this.generateRouteFromConfig(view);

      if (view.lazyLoaded) {
        // lazy-loaded views' routing is still hardcoded in the app.routing
        continue;
      }
      if (
        !overwriteExistingRoutes &&
        additionalRoutes.find((r) => r.path === route.path)
      ) {
        this.loggingService.warn(
          "ignoring route from view config because the path is already defined: " +
            view._id
        );
        continue;
      }

      routes.push(route);
    }

    // add routes from other sources (e.g. pre-existing  hard-coded routes)
    const noDuplicates = additionalRoutes.filter(
      (r) => !routes.find((o) => o.path === r.path)
    );
    routes.push(...noDuplicates);

    this.router.resetConfig(routes);
  }

  private generateRouteFromConfig(view: ViewConfig): Route {
    const path = view._id.substring(PREFIX_VIEW_CONFIG.length); // remove prefix to get actual path

    const route: Route = {
      path: path,
      component: COMPONENT_MAP[view.component],
    };

    const routeData: RouteData = {};

    if (view.permittedUserRoles) {
      route.canActivate = [UserRoleGuard];
      routeData.permittedUserRoles = view.permittedUserRoles;
    }

    if (view.config) {
      routeData.config = view.config;
    }

    route.data = routeData;
    return route;
  }
}
