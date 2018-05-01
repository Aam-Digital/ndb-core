import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolDetailComponent } from './school-detail/school-detail.component';
import {MatTableModule, MatFormFieldModule, MatSortModule} from "@angular/material";
import {SchoolsServices} from "../schoolsShared/schools.services";
import {MatExpansionModule} from '@angular/material/expansion';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSortModule,
    MatExpansionModule
  ],
  declarations: [SchoolDetailComponent],

  providers: [SchoolDetailComponent,
        SchoolsServices]
})
export class SchoolDetailsModule { }
