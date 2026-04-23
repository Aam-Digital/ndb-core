import { inject, Injectable } from "@angular/core";
import { Route, Router } from "@angular/router";
import { ConfigService } from "../config.service";
import { Logging } from "../../logging/logging.service";
import { PREFIX_VIEW_CONFIG, ViewConfig } from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { NotFoundComponent } from "./not-found/not-found.component";
import { AuthGuard } from "../../session/auth.guard";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { RoutedViewComponent } from "../../ui/routed-view/routed-view.component";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import {
  getRuntimePathFromViewConfig,
  isReservedFixedRoutePath,
  normalizeRoutePath,
  RuntimeViewPath,
} from "./route-paths";

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
  private configService = inject(ConfigService);
  private router = inject(Router);

  /**
   * Initialize routes from the config while respecting existing routes.
   */
  initRouting() {
    const viewConfigs =
      this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);
    this.reloadRouting(viewConfigs, this.router.config, {
      prefixEntityRoutes: true,
      addLegacyEntityRedirects: true,
      blockReservedRouteOverrides: true,
    });
  }

  /**
   * Add additional routes to the existing routing configuration, e.g. registering view configs for a new module.
   * @param viewConfigs
   */
  addRoutes(viewConfigs: ViewConfig[]) {
    this.reloadRouting(viewConfigs, this.router.config);
  }

  /**
   * Reset the routing config and reload it from the global config.
   *
   * @param viewConfigs The configs loaded from the ConfigService
   * @param additionalRoutes Optional array of routes to keep in addition to the ones loaded from config
   */
  reloadRouting(
    viewConfigs: ViewConfig[],
    additionalRoutes: Route[] = [],
    options: ReloadRoutingOptions = {},
  ) {
    const routes: Route[] = [];
    const redirects: Route[] = [];

    for (const view of viewConfigs) {
      try {
        const runtimePath = getRuntimePathFromViewConfig(view, {
          prefixEntityRoutes: options.prefixEntityRoutes,
        });
        if (
          options.blockReservedRouteOverrides &&
          isReservedFixedRoutePath(runtimePath.path)
        ) {
          Logging.warn(
            `Skipped config route ${view._id} because it conflicts with a reserved fixed route.`,
          );
          continue;
        }

        const newRoute = this.createRoute(view, runtimePath.path, additionalRoutes);
        routes.push(newRoute);

        const legacyRedirect = this.generateLegacyRedirect(
          runtimePath,
          options,
          routes,
          redirects,
          additionalRoutes,
        );
        if (legacyRedirect) {
          redirects.push(legacyRedirect);
        }
      } catch (e) {
        Logging.warn(
          `Failed to create route for view ${view._id}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    routes.push(...redirects);

    // add routes from other sources (e.g. pre-existing  hard-coded routes)
    const noDuplicates = additionalRoutes.filter(
      (r) => !routes.find((o) => o.path === r.path),
    );

    // change wildcard route to show not-found component instead of empty page
    const wildcardRoute = noDuplicates.find((route) => route.path === "**");
    if (wildcardRoute) {
      wildcardRoute.component = NotFoundComponent;
    }

    routes.push(...noDuplicates);

    this.router.resetConfig(routes);
  }

  private createRoute(view: ViewConfig, path: string, additionalRoutes: Route[]) {
    const existingRoute = additionalRoutes.find((r) => r.path === path);

    if (existingRoute) {
      return this.generateRouteFromConfig(view, existingRoute);
    } else {
      return this.generateRouteFromConfig(view, {
        path,
        component: RoutedViewComponent,
        data: { component: view.component },
      });
    }
  }

  private generateLegacyRedirect(
    runtimePath: RuntimeViewPath,
    options: ReloadRoutingOptions,
    routes: Route[],
    redirects: Route[],
    additionalRoutes: Route[],
  ): Route | undefined {
    if (!options.addLegacyEntityRedirects || !runtimePath.legacyPath) {
      return undefined;
    }

    const legacyPath = normalizeRoutePath(runtimePath.legacyPath);
    if (
      !legacyPath ||
      legacyPath === runtimePath.path ||
      isReservedFixedRoutePath(legacyPath)
    ) {
      return undefined;
    }

    if (
      routes.some((route) => route.path === legacyPath) ||
      redirects.some((route) => route.path === legacyPath) ||
      additionalRoutes.some((route) => route.path === legacyPath)
    ) {
      return undefined;
    }

    return {
      path: legacyPath,
      pathMatch: "full",
      redirectTo: `/${runtimePath.path}`,
    };
  }

  private generateRouteFromConfig(view: ViewConfig, route: Route): Route {
    route.data = { ...route?.data }; // data of currently active route is readonly, which can throw errors here
    route.canActivate = [AuthGuard, EntityPermissionGuard];
    route.canDeactivate = [
      () => inject(UnsavedChangesService).checkUnsavedChanges(),
    ];

    if (view.permittedUserRoles) {
      route.canActivate.push(UserRoleGuard);
      route.data.permittedUserRoles = view.permittedUserRoles;
    }

    if (view.component) {
      route.component = RoutedViewComponent;
      route.data.component = view.component;
    }

    if (view.config) {
      route.data.config = view.config;
    }

    return route;
  }
}

interface ReloadRoutingOptions {
  prefixEntityRoutes?: boolean;
  addLegacyEntityRedirects?: boolean;
  blockReservedRouteOverrides?: boolean;
}
