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

import { RouterModule, Routes } from '@angular/router';
import { LoggedInGuard } from './session/logged-in.guard';
import { ModuleWithProviders } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import {UserAccountComponent} from './user/user-account/user-account.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user', component: UserAccountComponent}, // loadChildren: 'app/user/user.module#UserModule', canActivate: [LoggedInGuard] },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
