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
import { ModuleWithProviders } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay";
import { Registry } from "./core/registry/dynamic-registry";
import { EmptyComponent } from "./core/view/dynamic-routing/empty/empty.component";
import { NotFoundComponent } from "./core/view/dynamic-routing/not-found/not-found.component";

export class RouteRegistry extends Registry<ComponentType<any>> {}
export const routesRegistry = new RouteRegistry();

/**
 * Marks a class to be the target when routing.
 * Use this by adding the annotation `@RouteTarget("...")` to a component.
 * The name provided to the annotation can then be used in the configuration.
 *
 * IMPORTANT:
 *  Angular ignores all components without references in the code in a production build.
 *  Dynamic components should therefore be added to a static array in the module where they are declared.
 */
export function RouteTarget(name: string) {
  return (ctor: ComponentType<any>) => {
    routesRegistry.add(name, ctor);
  };
}

/**
 * All routes configured for the main app routing.
 */
export const allRoutes: Routes = [
  // routes are added dynamically by the RouterService
  {
    path: "admin/conflicts",
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
  { path: "404", component: NotFoundComponent },
  { path: "**", pathMatch: "full", component: EmptyComponent },
];

/**
 * Main app RouterModule with centrally configured allRoutes.
 */
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(
  allRoutes,
  { relativeLinkResolution: "legacy" }
);
