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

import { NgModule } from '@angular/core';
import {CommonModule, DatePipe, PercentPipe} from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { UiHelperModule } from '../ui-helper/ui-helper.module';
import { SchoolsModule } from '../schools/schools.module';
import { ChildDetailsComponent } from './child-details/child-details.component';
import { ChildrenListComponent } from './children-list/children-list.component';
import { AttendanceBlockComponent } from './attendance/attendance-block/attendance-block.component';
import { ChildAttendanceComponent } from './attendance/child-attendance/child-attendance.component';
import { ChildBlockComponent } from './child-block/child-block.component';
import { ChildrenCountDashboardComponent } from './children-count-dashboard/children-count-dashboard.component';
import { AttendanceAverageDashboardComponent } from './attendance/attendance-average-dashboard/attendance-average-dashboard.component';
import { AttendanceWarningsDashboardComponent } from './attendance/attendance-warnings-dashboard/attendance-warnings-dashboard.component';
import { ChildSelectComponent } from './child-select/child-select.component';
import { EditSchoolDialogComponent } from './view-schools-component/edit-school-dialog/edit-school-dialog.component';
import { EducationalMaterialComponent } from './educational-material/educational-material.component';
import { AserComponent } from './aser/aser.component';
import { AddMonthAttendanceComponent } from './attendance/add-month-attendance/add-month-attendance.component';
import { ViewSchoolsComponent } from './view-schools-component/view-schools.component';
import { AttendanceDaysComponent } from './attendance/attendance-days/attendance-days.component';
import { AttendanceDetailsComponent } from './attendance/attendance-details/attendance-details.component';
import { AddDayAttendanceComponent } from './attendance/add-day-attendance/add-day-attendance.component';
import { AttendanceWeekDashboardComponent } from './attendance/attendance-week-dashboard/attendance-week-dashboard.component';
import { AttendanceDayBlockComponent } from './attendance/attendance-days/attendance-day-block.component';
import { AttendanceManagerComponent } from './attendance/attendance-manager/attendance-manager.component';
import { HealthCheckupComponent } from './health-checkup/health-checkup.component';
import { ChildrenService } from './children.service';
import { NotesListComponent } from './notes-list/notes-list.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    UiHelperModule,
    FlexLayoutModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FilterPipeModule,
    SchoolsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatListModule
  ],
  declarations: [
    AttendanceBlockComponent,
    ChildBlockComponent,
    ChildAttendanceComponent,
    ChildDetailsComponent,
    ChildrenListComponent,
    ChildrenCountDashboardComponent,
    AttendanceAverageDashboardComponent,
    AttendanceWarningsDashboardComponent,
    ChildSelectComponent,
    EditSchoolDialogComponent,
    EducationalMaterialComponent,
    AserComponent,
    AddMonthAttendanceComponent,
    ViewSchoolsComponent,
    AttendanceDayBlockComponent,
    AttendanceDaysComponent,
    AttendanceDetailsComponent,
    AddDayAttendanceComponent,
    AttendanceWeekDashboardComponent,
    AttendanceManagerComponent,
    HealthCheckupComponent,
    NotesListComponent,
  ],
  providers: [ChildrenService, DatePipe, PercentPipe],
  exports: [
    ChildBlockComponent,
    ChildSelectComponent,
    ChildrenCountDashboardComponent,
    AttendanceAverageDashboardComponent,
    AttendanceWarningsDashboardComponent,
    ViewSchoolsComponent,
    AttendanceWarningsDashboardComponent,
    AttendanceWeekDashboardComponent,
    AttendanceDaysComponent,
  ],
  entryComponents: [EditSchoolDialogComponent, AttendanceDetailsComponent],
})
export class ChildrenModule { }
