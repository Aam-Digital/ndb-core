import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Note } from '../model/note';
import { ConfirmationDialogService } from '../../../core/confirmation-dialog/confirmation-dialog.service';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { InteractionTypes } from '../interaction-types.enum';
import { AbstractDetailsComponent } from '../../../core/entity-subrecord/AbstractDetailsComponent';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss'],
})
export class NoteDetailsComponent extends AbstractDetailsComponent<Note> {

  smallScreen: boolean;

  interactionTypes = Object.values(InteractionTypes);

  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<NoteDetailsComponent>,
              confirmationDialog: ConfirmationDialogService,
              entityMapper: EntityMapperService) {
    super(data, dialogRef, confirmationDialog, entityMapper);

    this.smallScreen = window.innerWidth < 500;
  }

}
