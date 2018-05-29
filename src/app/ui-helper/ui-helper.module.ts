import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {MatButtonModule, MatDialogModule} from '@angular/material';
import {ConfirmationDialogService} from './confirmation-dialog/confirmation-dialog.service';

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
export class UiHelperModule { }
