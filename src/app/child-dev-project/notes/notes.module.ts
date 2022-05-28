import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NoteDetailsComponent } from "./note-details/note-details.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { NotesManagerComponent } from "./notes-manager/notes-manager.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatTableModule } from "@angular/material/table";
import { FlexLayoutModule } from "@angular/flex-layout";
import { RouterModule } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSortModule } from "@angular/material/sort";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SchoolsModule } from "../schools/schools.module";
import { MatListModule } from "@angular/material/list";
import { ChildrenModule } from "../children/children.module";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatTreeModule } from "@angular/material/tree";
import { MatTabsModule } from "@angular/material/tabs";
import { MatPaginatorModule } from "@angular/material/paginator";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../core/form-dialog/form-dialog.module";
import { Angulartics2Module } from "angulartics2";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityListModule } from "../../core/entity-components/entity-list/entity-list.module";
import { ConfigurableEnumModule } from "../../core/configurable-enum/configurable-enum.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ChildMeetingNoteAttendanceComponent } from "./note-details/child-meeting-attendance/child-meeting-note-attendance.component";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { NoteAttendanceCountBlockComponent } from "./note-attendance-block/note-attendance-count-block.component";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NotesDashboardComponent } from "./dashboard-widgets/notes-dashboard/notes-dashboard.component";
import { NotesOfChildComponent } from "./notes-of-child/notes-of-child.component";
import { DashboardModule } from "../../core/dashboard/dashboard.module";
import { ExportModule } from "../../core/export/export.module";
import { ImportantNotesComponent } from "./dashboard-widgets/important-notes/important-notes.component";

@NgModule({
  declarations: [
    NoteDetailsComponent,
    NotesManagerComponent,
    ChildMeetingNoteAttendanceComponent,
    NoteAttendanceCountBlockComponent,
    NotesDashboardComponent,
    NotesOfChildComponent,
    ImportantNotesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ConfirmationDialogModule,
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
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SchoolsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatListModule,
    ChildrenModule,
    DragDropModule,
    MatTreeModule,
    MatTabsModule,
    MatPaginatorModule,
    FormDialogModule,
    Angulartics2Module,
    EntitySubrecordModule,
    EntityListModule,
    ConfigurableEnumModule,
    AttendanceModule,
    MatSlideToggleModule,
    EntityUtilsModule,
    FontAwesomeModule,
    MatMenuModule,
    DashboardModule,
    ExportModule,
  ],
  exports: [NoteDetailsComponent],
})
export class NotesModule {
  static dynamicComponents = [
    NotesManagerComponent,
    NoteAttendanceCountBlockComponent,
    NotesDashboardComponent,
    NotesOfChildComponent,
  ];
}
