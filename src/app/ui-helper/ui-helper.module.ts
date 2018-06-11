import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule, MatSnackBarModule,
  MatTableModule
} from '@angular/material';
import {ConfirmationDialogService} from './confirmation-dialog/confirmation-dialog.service';
import { EntitySubrecordComponent } from './entity-subrecord/entity-subrecord.component';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  declarations: [ConfirmationDialogComponent, EntitySubrecordComponent],
  exports: [EntitySubrecordComponent],
  providers: [ConfirmationDialogService],
  entryComponents: [ConfirmationDialogComponent],
})
export class UiHelperModule { }
