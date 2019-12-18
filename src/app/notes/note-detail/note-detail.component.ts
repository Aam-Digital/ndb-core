import {Component, Inject} from '@angular/core';
import {AbstractDetailsComponent} from '../../ui-helper/AbstractDetailsComponent';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {NotesService} from '../notes.service';
import {NoteModel} from '../note.model';

@Component({
  selector: 'app-note-detail',
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss']
})
export class NoteDetailComponent extends AbstractDetailsComponent<NoteModel> {

  smallScreen: boolean;

  interactionTypes = NoteModel.INTERACTION_TYPES;

  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              dialogRef: MatDialogRef<NoteDetailComponent>,
              confirmationDialog: ConfirmationDialogService,
              entityMapper: EntityMapperService,
              private notesService: NotesService) {
    super(data, dialogRef, confirmationDialog, entityMapper);

    this.smallScreen = window.innerWidth < 500;
  }

  save() {
    this.notesService.saveNewNote(this.entity as NoteModel);
    this.dialogRef.close(this.entity);
  }

}
