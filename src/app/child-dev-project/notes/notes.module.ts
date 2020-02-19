import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteDetailComponent } from './note-detail/note-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { NoteManagerComponent } from './note-manager/note-manager.component';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSortModule } from '@angular/material/sort';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { SchoolsModule } from '../schools/schools.module';
import { MatListModule } from '@angular/material/list';
import { ChildrenModule } from '../children/children.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTreeModule } from '@angular/material/tree';
import { ChildPresenceListComponent } from './note-detail/child-presence-list/child-presence-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { UiHelperModule } from '../../core/ui-helper/ui-helper.module';
import { NotePresenceListComponent } from './note-detail/note-presence-list/note-presence-list.component';


@NgModule({
  declarations: [NoteDetailComponent, NoteManagerComponent, ChildPresenceListComponent, NotePresenceListComponent],
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
        MatListModule,
        ChildrenModule,
        DragDropModule,
        MatTreeModule,
        MatTabsModule,
        MatPaginatorModule,
    ],
  entryComponents: [NoteDetailComponent],
  providers: [],
})
export class NotesModule { }
