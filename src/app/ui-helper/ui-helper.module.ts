import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatSnackBarModule,
  MatSortModule,
  MatFormFieldModule,
  MatTableModule
} from '@angular/material';
import {ConfirmationDialogService} from './confirmation-dialog/confirmation-dialog.service';
import { EntitySubrecordComponent } from './entity-subrecord/entity-subrecord.component';
import { KeysPipe } from './keys-pipe/keys.pipe';

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
    MatSortModule,
    MatFormFieldModule,
    MatAutocompleteModule,
  ],
  declarations: [ConfirmationDialogComponent, EntitySubrecordComponent, KeysPipe],
  exports: [EntitySubrecordComponent, KeysPipe],
  providers: [ConfirmationDialogService],
  entryComponents: [ConfirmationDialogComponent],
})
export class UiHelperModule { }
