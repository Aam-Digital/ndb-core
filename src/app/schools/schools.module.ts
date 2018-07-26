import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SchoolsListComponent} from './schools-list/schools-list.component';
import {
  MatTableModule, MatFormFieldModule, MatInputModule, MatSortModule, MatExpansionModule,
  MatIconModule, MatCheckboxModule, MatButtonModule, MatSnackBarModule
} from '@angular/material';
import {SchoolsServices} from './schoolsShared/schools.services';
import {SchoolDetailComponent} from './school-detail/school-detail.component';
import { SchoolBlockComponent } from './school-block/school-block.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';

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
