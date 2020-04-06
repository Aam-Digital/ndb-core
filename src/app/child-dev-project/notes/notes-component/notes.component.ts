import { Component, OnInit } from '@angular/core';
import { Note } from '../model/note';
import { ChildrenService } from '../../children/children.service';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../../../core/session/session-service/session.service';
import { ColumnDescription } from '../../../core/entity-subrecord/entity-subrecord/column-description';
import { DatePipe } from '@angular/common';
import { NoteDetailsComponent } from '../note-details/note-details.component';
import { ColumnDescriptionInputType } from '../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum';

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
    new ColumnDescription('date', 'Date', ColumnDescriptionInputType.DATE, null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd'), 'xs'),
    new ColumnDescription('subject', 'Topic', ColumnDescriptionInputType.TEXT, null, undefined, 'xs'),
    new ColumnDescription('text', 'Notes', ColumnDescriptionInputType.TEXTAREA, null, undefined, 'md'),
    new ColumnDescription('author', 'SW', ColumnDescriptionInputType.TEXT, null, undefined, 'md'),
    new ColumnDescription('warningLevel', '', ColumnDescriptionInputType.SELECT,
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
    const user = this.sessionService.getCurrentUser() ? this.sessionService.getCurrentUser().name : '';
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
