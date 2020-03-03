import { Component, Inject } from '@angular/core';
import { AbstractDetailsComponent } from '../../../core/ui-helper/AbstractDetailsComponent';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Note } from '../note';
import { ConfirmationDialogService } from '../../../core/ui-helper/confirmation-dialog/confirmation-dialog.service';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';

@Component({
  selector: 'app-note-detail',
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss'],
})
export class NoteDetailComponent extends AbstractDetailsComponent<Note> {

  smallScreen: boolean;

  interactionTypes = Note.INTERACTION_TYPES;

  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<NoteDetailComponent>,
              confirmationDialog: ConfirmationDialogService,
              entityMapper: EntityMapperService) {
    super(data, dialogRef, confirmationDialog, entityMapper);

    this.smallScreen = window.innerWidth < 500;
  }

}
