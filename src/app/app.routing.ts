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
import { DashboardComponent } from "./child-dev-project/dashboard/dashboard/dashboard.component";
import { SchoolsListComponent } from "./child-dev-project/schools/schools-list/schools-list.component";
import { SchoolDetailsComponent } from "./child-dev-project/schools/school-details/school-details.component";
import { ChildDetailsComponent } from "./child-dev-project/children/child-details/child-details.component";
import { UserAccountComponent } from "./core/user/user-account/user-account.component";
import { ChildrenListComponent } from "./child-dev-project/children/children-list/children-list.component";
import { ChildAttendanceComponent } from "./child-dev-project/attendance/child-attendance/child-attendance.component";
import { AdminComponent } from "./core/admin/admin/admin.component";
import { AdminGuard } from "./core/admin/admin.guard";
import { NotesManagerComponent } from "./child-dev-project/notes/notes-manager/notes-manager.component";
import { AddMonthAttendanceComponent } from "./child-dev-project/attendance/add-month-attendance/add-month-attendance.component";
import { AddDayAttendanceComponent } from "./child-dev-project/attendance/add-day-attendance/add-day-attendance.component";
import { AttendanceManagerComponent } from "./child-dev-project/attendance/attendance-manager/attendance-manager.component";
import { HowToComponent } from "./core/help/how-to/how-to.component";
import { UserListComponent } from "./core/admin/user-list/user-list.component";

/**
 * All routes configured for the main app routing.
 */
export const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "user", component: UserAccountComponent },
  { path: "school", component: SchoolsListComponent },
  { path: "school/:id", component: SchoolDetailsComponent },
  { path: "child", component: ChildrenListComponent },
  { path: "child/:id", component: ChildDetailsComponent },
  { path: "child/:id/attendance", component: ChildAttendanceComponent },
  { path: "note", component: NotesManagerComponent },
  { path: "attendance", component: AttendanceManagerComponent },
  { path: "attendance/add/month", component: AddMonthAttendanceComponent },
  { path: "attendance/add/day", component: AddDayAttendanceComponent },
  { path: "admin", component: AdminComponent, canActivate: [AdminGuard] },
  { path: "users", component: UserListComponent, canActivate: [AdminGuard] },
  {
    path: "admin/conflicts",
    canActivate: [AdminGuard],
    loadChildren: () =>
      import("./conflict-resolution/conflict-resolution.module").then(
        (m) => m.ConflictResolutionModule
      ),
  },
  { path: "help", component: HowToComponent },
  { path: "**", redirectTo: "/" },
];
