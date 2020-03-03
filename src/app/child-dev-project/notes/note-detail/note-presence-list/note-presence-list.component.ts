import { Component, Input } from '@angular/core';
import { Note } from '../../note';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-note-presence-list',
  templateUrl: './note-presence-list.component.html',
  styleUrls: ['./note-presence-list.component.scss'],
})
export class NotePresenceListComponent {

  @Input() entity: Note;
  @Input() recordForm: NgForm;
  smallScreen: boolean;

  constructor() {
    this.smallScreen = window.innerWidth < 500;
  }

}
