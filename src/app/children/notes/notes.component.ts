import { Component, OnInit } from '@angular/core';
import {Note} from './note';
import {ChildrenService} from '../children.service';
import {ActivatedRoute} from '@angular/router';
import {SessionService} from '../../session/session.service';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {DatePipe} from '@angular/common';
import {NoteDetailsComponent} from './note-details/note-details.component';

@Component({
  selector: 'app-notes',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" ' +
            '[newRecordFactory]="generateNewRecordFactory()" [detailsComponent]="detailsComponent">' +
            '</app-entity-subrecord>',
})
export class NotesComponent implements OnInit {

  childId: string;
  records: Array<Note>;
  detailsComponent = NoteDetailsComponent;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('date', 'Date', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd'), 'xs'),
    new ColumnDescription('subject', 'Topic', 'text', null, undefined, 'xs'),
    new ColumnDescription('text', 'Notes', 'textarea', null, undefined, 'md'),
    new ColumnDescription('author', 'SW', 'text', null, undefined, 'md'),
    new ColumnDescription('warningLevel', '', 'select',
      [{value: 'OK', label: 'Solved'}, {value: 'WARNING', label: 'Needs Follow-Up'}, {value: 'URGENT', label: 'Urgent Follow-Up'}],
      (v) => '', 'md'),
  ];


  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private sessionService: SessionService,
              private datePipe: DatePipe) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id');

      this.childrenService.getNotesOfChild(this.childId)
        .subscribe(results => this.records = results.sort((a, b) => {
          return (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0); } ));
    });
  }


  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const user = this.sessionService.getCurrentUser().name;
    const childId = this.childId;

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      newNote.children = [childId];
      newNote.author = user;

      return newNote;
    };
  }
}
