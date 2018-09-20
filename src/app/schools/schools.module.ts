import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SchoolsListComponent} from './schools-list/schools-list.component';
import {
  MatTableModule,
  MatFormFieldModule,
  MatInputModule,
  MatSortModule,
  MatExpansionModule,
  MatIconModule,
  MatCheckboxModule,
  MatButtonModule,
  MatSnackBarModule,
  MatButtonToggleModule,
  MatAutocompleteModule,
  MatCardModule,
  MatSidenavModule, MatDialogModule
} from '@angular/material';
import {SchoolsServices} from './schoolsShared/schools.services';
import {SchoolDetailComponent} from './school-detail/school-detail.component';
import { SchoolBlockComponent } from './school-block/school-block.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import { MatPaginatorModule, MatProgressSpinnerModule } from '@angular/material';
import {MatSelectModule} from '@angular/material/select';
import {UiHelperModule} from '../ui-helper/ui-helper.module';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatExpansionModule,
    MatButtonModule,
    FlexLayoutModule,
    MatSnackBarModule,
    MatIconModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSortModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatAutocompleteModule,
    UiHelperModule,
    ReactiveFormsModule
  ],
  declarations: [
    SchoolBlockComponent,
    SchoolsListComponent,
    SchoolDetailComponent,
  ],
  exports: [SchoolBlockComponent],
  providers: [SchoolsServices]
})
export class SchoolsModule { }
