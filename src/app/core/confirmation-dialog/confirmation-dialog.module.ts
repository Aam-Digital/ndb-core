import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogService } from './confirmation-dialog.service';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
  ],
  declarations: [ConfirmationDialogComponent],
  providers: [ConfirmationDialogService],
  entryComponents: [ConfirmationDialogComponent],
})
export class ConfirmationDialogModule { }
