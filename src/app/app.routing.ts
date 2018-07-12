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

import {RouterModule, Routes} from '@angular/router';
import {ModuleWithProviders} from '@angular/core';
import {DashboardComponent} from './dashboard/dashboard/dashboard.component';
import {SchoolsListComponent} from './schools/schools-list/schools-list.component';
import {SchoolDetailComponent} from './schools/school-detail/school-detail.component';
import {ChildDetailsComponent} from './children/child-details/child-details.component';
import {UserAccountComponent} from './user/user-account/user-account.component';
import {ChildrenListComponent} from './children/children-list/children-list.component';
import {ChildAttendanceComponent} from './children/attendance/child-attendance/child-attendance.component';
import {AdminComponent} from './admin/admin/admin.component';
import {AdminGuard} from './admin/admin.guard';

export const routes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'user', component: UserAccountComponent},
  {path: 'selectedSchool', component: SchoolsListComponent},
  {path: 'selectedSchool/:id', component: SchoolDetailComponent},
  {path: 'child', component: ChildrenListComponent},
  {path: 'child/:id', component: ChildDetailsComponent},
  {path: 'child/:id/attendance', component: ChildAttendanceComponent},
  {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  {path: '**', redirectTo: '/'},
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
