import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogCloseComponent } from './dialog-close.component';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";

@NgModule({
  declarations: [
    DialogCloseComponent
  ],
  exports: [
    DialogCloseComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class DialogCloseModule { }
