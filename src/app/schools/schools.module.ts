import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolsComponent } from './schools/schools.component';
import {MatTableModule, MatFormFieldModule, MatInputModule} from "@angular/material";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  declarations: [SchoolsComponent],
  exports: [SchoolsComponent],
  providers: [SchoolsComponent]
})
export class SchoolsModule { }
