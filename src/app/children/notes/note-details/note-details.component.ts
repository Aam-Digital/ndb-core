import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {Note} from '../note';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {EntityMapperService} from '../../../entity/entity-mapper.service';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss']
})
export class NoteDetailsComponent implements OnInit {
  @Input() note: Note;
  originalNote: Note;
  @ViewChild('recordForm', { static: true }) form;
  interactionTypes = Note.INTERACTION_TYPES;


  constructor(@Inject(MAT_DIALOG_DATA) data: any,
              public dialogRef: MatDialogRef<NoteDetailsComponent>,
              private confirmationDialog: ConfirmationDialogService,
              private entityMapper: EntityMapperService) {
    this.note = data.entity;
    this.originalNote = Object.assign({}, this.note);

    this.dialogRef.beforeClose().subscribe((returnedNote) => {
      if (!returnedNote && this.form.dirty) {
        this.confirmationDialog.openDialog('Save Changes?', 'Do you want to save the changes you made to the record?')
          .afterClosed().subscribe(confirmed => {
            if (confirmed) {
              this.save();
            } else {
              this.cancel();
            }
        });
      }
    });
  }

  ngOnInit() {
  }

  save() {
    this.entityMapper.save(this.note);
    this.dialogRef.close(this.note);
  }

  cancel() {
    Object.assign(this.note, this.originalNote);
    this.dialogRef.close(this.note);
  }

}
