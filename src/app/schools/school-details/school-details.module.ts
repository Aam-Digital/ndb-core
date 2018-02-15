import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolDetailComponent } from './school-detail/school-detail.component';
import {SchoolsServices} from "../schoolsShared/schools.services";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SchoolDetailComponent],

  providers: [SchoolDetailComponent,
        SchoolsServices]
})
export class SchoolDetailsModule { }
