import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SchoolsListComponent} from './schools-list/schools-list.component';
import {
  MatTableModule, MatFormFieldModule, MatInputModule, MatSortModule, MatExpansionModule,
  MatIconModule
} from '@angular/material';
import {SchoolDetailComponent} from './school-detail/school-detail.component';
import { SchoolBlockComponent } from './school-block/school-block.component';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatExpansionModule,
    MatIconModule,
  ],
  declarations: [
    SchoolBlockComponent,
    SchoolsListComponent,
    SchoolDetailComponent,
  ],
  exports: [SchoolBlockComponent],
  providers: []
})
export class SchoolsModule { }
