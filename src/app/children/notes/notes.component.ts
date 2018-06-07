import { Component, OnInit } from '@angular/core';
import {AbstractChildSubrecordComponent} from '../abstract-child-subrecord.component';
import {Observable} from 'rxjs/Observable';
import {Note} from './note';
import {ChildrenService} from '../children.service';
import {MatSnackBar} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {SessionService} from '../../session/session.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent extends AbstractChildSubrecordComponent<Note> implements OnInit {

  columnsToDisplay = ['date', 'subject', 'text', 'author', 'warning', 'actions'];


  getRecords(childId: string): Observable<Note[]> { return this.childrenService.getNotesOfChild(childId); }
  getRecord(recordId: string): Observable<Note> { return this.childrenService.getNote(recordId); };
  saveRecord(record: Note) { return this.childrenService.saveNote(record); };
  removeRecord(record: Note) { return this.childrenService.removeNote(record); };

  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private snackBar: MatSnackBar,
              private confirmationDialog: ConfirmationDialogService,
              private sessionService: SessionService) {
    super(route, childrenService, snackBar, confirmationDialog);
  }

  ngOnInit() {
    this.init();
  }


  generateNewRecord() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.child = this.child.getId();
    newNote.author = this.sessionService.getCurrentUser().name;

    this.new(newNote);
  }
}
