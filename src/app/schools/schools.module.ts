import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolsComponent } from './schools/schools.component';
import {MatTableModule, MatFormFieldModule, MatInputModule, MatSortModule} from "@angular/material";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ],
  declarations: [SchoolsComponent],
  exports: [SchoolsComponent],
  providers: [SchoolsComponent]
})
export class SchoolsModule { }
