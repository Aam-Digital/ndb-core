import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolDetailComponent } from './school-detail/school-detail.component';
import {MatTableModule, MatFormFieldModule, MatSortModule} from "@angular/material";
import {SchoolsServices} from "../schoolsShared/schools.services";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSortModule,
    MatSortModule
  ],
  declarations: [SchoolDetailComponent],

  providers: [SchoolDetailComponent,
        SchoolsServices]
})
export class SchoolDetailsModule { }
