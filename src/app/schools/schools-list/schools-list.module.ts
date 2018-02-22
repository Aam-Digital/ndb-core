import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolsListComponent } from './schools/schools-list.component';
import {MatTableModule, MatFormFieldModule, MatInputModule, MatSortModule} from "@angular/material";
import {SchoolsServices} from "../schoolsShared/schools.services";
import {SchoolDetailComponent} from "../school-details/school-detail/school-detail.component";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ],
  declarations: [
    SchoolsListComponent,
    SchoolDetailComponent],
  exports: [
    SchoolsListComponent,
    SchoolDetailComponent],
  providers: [
    SchoolsListComponent,
    SchoolsServices,
    SchoolDetailComponent]
})
export class SchoolsListModule { }
