import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SchoolsListComponent} from './schools-list/schools-list.component';
import {MatTableModule, MatFormFieldModule, MatInputModule, MatSortModule, MatExpansionModule} from '@angular/material';
import {SchoolsServices} from './schoolsShared/schools.services';
import {SchoolDetailComponent} from './school-detail/school-detail.component';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatExpansionModule,
  ],
  declarations: [
    SchoolsListComponent,
    SchoolDetailComponent,
  ],
  exports: [],
  providers: [SchoolsServices]
})
export class SchoolsModule { }
