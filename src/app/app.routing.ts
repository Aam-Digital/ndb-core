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
import {NotesManagerComponent} from './children/notes/notes-manager/notes-manager.component';
import {AddMonthAttendanceComponent} from './children/attendance/add-month-attendance/add-month-attendance.component';
import {AddDayAttendanceComponent} from './children/attendance/add-day-attendance/add-day-attendance.component';
import {AttendanceManagerComponent} from './children/attendance/attendance-manager/attendance-manager.component';
import {HowToComponent} from './help/how-to/how-to.component';
import {UserListComponent} from './admin/user-list/user-list.component';

export const routes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'user', component: UserAccountComponent},
  {path: 'school', component: SchoolsListComponent},
  {path: 'school/:id', component: SchoolDetailComponent},
  {path: 'child', component: ChildrenListComponent},
  {path: 'child/:id', component: ChildDetailsComponent},
  {path: 'child/:id/attendance', component: ChildAttendanceComponent},
  {path: 'note', component: NotesManagerComponent},
  {path: 'attendance', component: AttendanceManagerComponent},
  {path: 'attendance/add/month', component: AddMonthAttendanceComponent},
  {path: 'attendance/add/day', component: AddDayAttendanceComponent},
  {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  {path: 'users', component: UserListComponent, canActivate: [AdminGuard]},
  {path: 'help', component: HowToComponent},
  {path: '**', redirectTo: '/'},
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
