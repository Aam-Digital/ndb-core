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
import { NotFoundComponent } from "./core/config/dynamic-routing/not-found/not-found.component";
import { UserAccountComponent } from "./core/user/user-account/user-account.component";
import { SupportComponent } from "./core/support/support/support.component";
import { AuthGuard } from "./core/session/auth.guard";
import { LoginComponent } from "./core/session/login/login.component";
import { AdminModule } from "./core/admin/admin.module";
import { PublicFormModule } from "./features/public-form/public-form.module";

/**
 * All routes configured for the main app routing.
 */
export const allRoutes: Routes = [
  // routes are added dynamically by the RouterService
  {
    path: "coming-soon/:feature",
    loadComponent: () =>
      import("./features/coming-soon/coming-soon/coming-soon.component").then(
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
    path: "public-form",
    children: PublicFormModule.routes,
  },
  {
    path: "admin",
    canActivate: [AuthGuard],
    // add directly without lazy-loading so that Menu can detect permissions for child routes
    children: AdminModule.routes,
  },
  { path: "login", component: LoginComponent },
  { path: "404", component: NotFoundComponent },

  {
    path: "**",
    pathMatch: "full",
    component: NotFoundComponent,
    canActivate: [AuthGuard],
  },
];
