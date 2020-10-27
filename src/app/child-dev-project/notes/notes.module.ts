import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NoteDetailsComponent } from "./note-details/note-details.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { NotesManagerComponent } from "./notes-manager/notes-manager.component";
import { MatIconModule } from "@angular/material/icon";
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
import { FilterPipeModule } from "ngx-filter-pipe";
import { SchoolsModule } from "../schools/schools.module";
import { MatListModule } from "@angular/material/list";
import { ChildrenModule } from "../children/children.module";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatTreeModule } from "@angular/material/tree";
import { ChildMeetingNoteAttendanceComponent } from "./note-details/child-meeting-attendance/child-meeting-note-attendance.component";
import { MatTabsModule } from "@angular/material/tabs";
import { MatPaginatorModule } from "@angular/material/paginator";
import { NotePresenceListComponent } from "./note-details/note-presence-list/note-presence-list.component";
import { EntitySubrecordModule } from "../../core/entity-subrecord/entity-subrecord.module";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../core/form-dialog/form-dialog.module";
import { Angulartics2Module } from "angulartics2";
import { NoteConfigLoaderService } from "./note-config-loader.service";

@NgModule({
  declarations: [
    NoteDetailsComponent,
    NotesManagerComponent,
    ChildMeetingNoteAttendanceComponent,
    NotePresenceListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    EntitySubrecordModule,
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
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatTabsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FilterPipeModule,
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
  ],
  providers: [NoteConfigLoaderService],
})
export class NotesModule {}
