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

import { Routes } from "@angular/router";
import { ApplicationLoadingComponent } from "./core/view/dynamic-routing/empty/application-loading.component";
import { NotFoundComponent } from "./core/view/dynamic-routing/not-found/not-found.component";
import { UserAccountComponent } from "./core/user/user-account/user-account.component";
import { SupportComponent } from "./core/support/support/support.component";
import { AuthGuard } from "./core/session/auth.guard";
import { LoginComponent } from "./core/session/login/login.component";

/**
 * Marks a class to be the target when routing.
 * Use this by adding the annotation `@RouteTarget("...")` to a component.
 * The name provided to the annotation can then be used in the configuration.
 *
 * IMPORTANT:
 *  The component also needs to be added to the `...Components` list of the respective module.
 */
export const RouteTarget = (_name: string) => (_) => undefined;

/**
 * All routes configured for the main app routing.
 */
export const allRoutes: Routes = [
  // routes are added dynamically by the RouterService
  {
    path: "coming-soon/:feature",
    loadComponent: () =>
      import("./core/coming-soon/coming-soon/coming-soon.component").then(
        (c) => c.ComingSoonComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: "user-account",
    component: UserAccountComponent,
    canActivate: [AuthGuard],
  },
  { path: "support", component: SupportComponent },
  // this can't be configured in config as the config is only loaded on login
  {
    path: "public-form/:id",
    loadComponent: () =>
      import("./features/public-form/public-form.component").then(
        (c) => c.PublicFormComponent,
      ),
  },
  { path: "login", component: LoginComponent },
  { path: "404", component: NotFoundComponent },

  {
    path: "**",
    pathMatch: "full",
    component: ApplicationLoadingComponent,
    canActivate: [AuthGuard],
  },
];
