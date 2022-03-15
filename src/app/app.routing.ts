/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { RouterModule, Routes } from "@angular/router";
import { InjectionToken, ModuleWithProviders } from "@angular/core";
import { UserRoleGuard } from "./core/permissions/user-role.guard";
import { ComponentType } from "@angular/cdk/overlay";
import { Registry } from "./core/registry/dynamic-registry";

export type RouteRegistry = Registry<ComponentType<any>>;
export const ROUTES = new InjectionToken<RouteRegistry>(
  "app.registries.allRoutes"
);
export const routesRegistry = new Registry<ComponentType<any>>();

/**
 * Marks a class to be the target when routing.
 * Use this as an annotation to component classes adding `@RouteTarget()` before the class definition.
 * @constructor
 */
export function RouteTarget() {
  return (ctor: ComponentType<any>) => {
    routesRegistry.add(ctor.name.replace("Component", ""), ctor);
  };
}

/**
 * All routes configured for the main app routing.
 */
export const allRoutes: Routes = [
  // routes are added dynamically by the RouterService
  {
    path: "admin/conflicts",
    canActivate: [UserRoleGuard],
    loadChildren: () =>
      import("./conflict-resolution/conflict-resolution.module").then(
        (m) => m["ConflictResolutionModule"]
      ),
  },
  {
    path: "coming-soon",
    loadChildren: () =>
      import("./core/coming-soon/coming-soon.module").then(
        (m) => m["ComingSoonModule"]
      ),
  },
  { path: "**", redirectTo: "/" },
];

/**
 * Main app RouterModule with centrally configured allRoutes.
 */
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(
  allRoutes,
  { relativeLinkResolution: "legacy" }
);
