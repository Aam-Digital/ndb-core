import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import {MatButtonModule} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
  ],
  declarations: [AdminComponent]
})
export class AdminModule { }
