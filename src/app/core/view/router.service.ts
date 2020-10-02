import { Injectable } from "@angular/core";
import { Route, Router } from "@angular/router";
import { COMPONENT_MAP } from "app/app.routing";
import { AdminGuard } from "../admin/admin.guard";
import { ConfigService } from "../config/config.service";
import { LoggingService } from "../logging/logging.service";
import { ViewConfig } from "./view-config.interface";

@Injectable({
  providedIn: "root",
})
export class RouterService {
  static readonly PREFIX_VIEW_CONFIG = "view:";

  constructor(
    private configService: ConfigService,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  /**
   * Initialize routes from the config while respecting existing routes.
   */
  initRouting() {
    this.reloadRouting(this.router.config);
  }

  /**
   * Reset the routing config and reload it from the global config.
   *
   * @param additionalRoutes Optional array of routes to keep in addition to the ones loaded from config
   */
  reloadRouting(additionalRoutes: Route[] = []) {
    const routes = [];

    const viewConfigs = this.configService.getAllConfigs<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG
    );
    for (const view of viewConfigs) {
      const path = view._id.substring(RouterService.PREFIX_VIEW_CONFIG.length); // remove prefix to get actual path
      if (additionalRoutes.find((r) => r.path === path)) {
        this.loggingService.warn(
          "ignoring route from view config because the path is already defined: " +
            view._id
        );
        continue;
      }

      const route: Route = {
        path: path,
        component: COMPONENT_MAP[view.component],
      };
      if (view.requiresAdmin) {
        route.canActivate = [AdminGuard];
      }
      if (view.config) {
        route.data = view.config;
      }
      routes.push(route);
    }

    routes.push(...additionalRoutes);

    this.router.resetConfig(routes);
  }
}
