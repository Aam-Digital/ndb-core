import { Component, OnInit } from '@angular/core';
import { Note } from '../../../child-dev-project/notes/note';
import { SessionService } from '../../session/session.service';
import { MatDialog } from '@angular/material/dialog';
import { NoteDetailComponent } from '../../../child-dev-project/notes/note-detail/note-detail.component';

@Component({
  selector: 'app-primary-action',
  templateUrl: './primary-action.component.html',
  styleUrls: ['./primary-action.component.scss'],
})
export class PrimaryActionComponent implements OnInit {

  constructor(private sessionService: SessionService,
              private dialog: MatDialog) { }

  ngOnInit() {
  }

  primaryAction() {
    this.dialog.open(NoteDetailComponent, {width: '80%', data: {entity: this.createNewNote()}});
  }

  private createNewNote() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.author = this.sessionService.getCurrentUser().name;
    return newNote;
  }
}
