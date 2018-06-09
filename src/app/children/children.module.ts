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
import { ChildDetailsComponent } from './child-details/child-details.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import { ChildrenListComponent } from './children-list/children-list.component';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatDialogModule,
  MatIconModule,
  MatSidenavModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule
} from '@angular/material';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ChildrenService} from './children.service';
import {AttendanceBlockComponent} from './attendance/attendance-block/attendance-block.component';
import {ChildAttendanceComponent} from './attendance/child-attendance/child-attendance.component';
import {UiHelperModule} from '../ui-helper/ui-helper.module';
import {ChildBlockComponent} from './child-block/child-block.component';
import { ChildrenCountDashboardComponent } from './children-count-dashboard/children-count-dashboard.component';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import { AttendanceAverageDashboardComponent } from './attendance/attendance-average-dashboard/attendance-average-dashboard.component';
import { AttendanceWarningsDashboardComponent } from './attendance/attendance-warnings-dashboard/attendance-warnings-dashboard.component';
import { NotesComponent } from './notes/notes.component';
import { NoteDetailsComponent } from './notes/note-details/note-details.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSelectModule,
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
    UiHelperModule,
  ],
  declarations: [
    AttendanceBlockComponent,
    ChildBlockComponent,
    ChildAttendanceComponent,
    NotesComponent,
    ChildDetailsComponent,
    ChildrenListComponent,
    ChildrenCountDashboardComponent,
    AttendanceAverageDashboardComponent,
    AttendanceWarningsDashboardComponent,
    NoteDetailsComponent,
  ],
  providers: [ChildrenService, DatePipe, PercentPipe],
  exports: [
    ChildBlockComponent,
    ChildrenCountDashboardComponent,
    AttendanceAverageDashboardComponent,
    AttendanceWarningsDashboardComponent
  ],
  entryComponents: [NoteDetailsComponent],
})
export class ChildrenModule { }
