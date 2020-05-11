import { Component, Input, ViewChild } from '@angular/core';
import { InteractionTypes } from '../interaction-types.enum';
import { Note } from '../model/note';
import { ShowsEntity } from '../../../core/form-dialog/shows-entity.interface';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss'],
})
export class NoteDetailsComponent implements ShowsEntity {
  @Input() entity: Note;
  @ViewChild('dialogForm', { static: true }) formDialogWrapper;

  smallScreen: boolean;

  interactionTypes = Object.values(InteractionTypes);

  constructor() {
    this.smallScreen = window.innerWidth < 500;
  }
}
