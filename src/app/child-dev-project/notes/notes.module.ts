import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NoteDetailsComponent } from "./note-details/note-details.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { NotesManagerComponent } from "./notes-manager/notes-manager.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { RouterModule } from "@angular/router";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSortModule } from "@angular/material/sort";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SchoolsModule } from "../schools/schools.module";
import { MatLegacyListModule as MatListModule } from "@angular/material/legacy-list";
import { ChildrenModule } from "../children/children.module";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatTreeModule } from "@angular/material/tree";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../core/form-dialog/form-dialog.module";
import { Angulartics2Module } from "angulartics2";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityListModule } from "../../core/entity-components/entity-list/entity-list.module";
import { ConfigurableEnumModule } from "../../core/configurable-enum/configurable-enum.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { ChildMeetingNoteAttendanceComponent } from "./note-details/child-meeting-attendance/child-meeting-note-attendance.component";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { NoteAttendanceCountBlockComponent } from "./note-attendance-block/note-attendance-count-block.component";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NotesDashboardComponent } from "./dashboard-widgets/notes-dashboard/notes-dashboard.component";
import { NotesRelatedToEntityComponent } from "./notes-related-to-entity/notes-related-to-entity.component";
import { DashboardModule } from "../../core/dashboard/dashboard.module";
import { ExportModule } from "../../core/export/export.module";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";
import { ImportantNotesDashboardComponent } from "./dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component";
import { EntitySelectModule } from "../../core/entity-components/entity-select/entity-select.module";

@NgModule({
  declarations: [
    NoteDetailsComponent,
    NotesManagerComponent,
    ChildMeetingNoteAttendanceComponent,
    NoteAttendanceCountBlockComponent,
    NotesDashboardComponent,
    NotesRelatedToEntityComponent,
    ImportantNotesDashboardComponent,
  ],
    imports: [
        CommonModule,
        FormsModule,
        ConfirmationDialogModule,
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
        CommonComponentsModule,
        EntitySelectModule,
    ],
  exports: [NoteDetailsComponent],
})
export class NotesModule {
  static dynamicComponents = [
    NotesManagerComponent,
    NoteAttendanceCountBlockComponent,
    NotesDashboardComponent,
    NotesRelatedToEntityComponent,
    ImportantNotesDashboardComponent,
  ];
}
