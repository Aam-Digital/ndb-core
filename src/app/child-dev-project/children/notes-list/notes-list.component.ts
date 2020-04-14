import { Component, OnInit } from '@angular/core';
import { Note } from '../../notes/note';
import { NoteDetailComponent } from '../../notes/note-detail/note-detail.component';
import { DatePipe } from '@angular/common';
import { ChildrenService } from '../children.service';
import { ActivatedRoute } from '@angular/router';
import { ColumnDescription, ColumnDescriptionInputType } from '../../../core/ui-helper/entity-subrecord/column-description';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { SessionService } from '../../../core/session/session.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
})
/**
 * The component that is responsible for listing the Notes that are related to a certain child
 */
export class NotesListComponent implements OnInit {

  childId: string;
  records: Array<Note> = [];
  detailsComponent = NoteDetailComponent;

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
              private datePipe: DatePipe,
              private entityMapperService: EntityMapperService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id');
    });
    this.childrenService.getNotesOfChild(this.childId).subscribe((notes: Note[]) => this.records = notes);
    /*this.entityMapperService.loadType<Note>(Note).then(notes => {
      this.records = notes.filter((note) => note.isLinkedWithChild(this.childId));
    }); */
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const user = this.sessionService.getCurrentUser() ? this.sessionService.getCurrentUser().name : '';
    const childId = this.childId;

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      newNote.addChild(childId);
      newNote.author = user;

      return newNote;
    };
  }

}
