import {Component, OnInit} from '@angular/core';
import {NoteModel} from '../../notes/note.model';
import {NoteDetailComponent} from '../../notes/note-detail/note-detail.component';
import {ColumnDescription, ColumnDescriptionInputType} from '../../ui-helper/entity-subrecord/column-description';
import {SessionService} from '../../session/session.service';
import {DatePipe} from '@angular/common';
import {ChildrenService} from '../children.service';
import {ActivatedRoute} from '@angular/router';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss']
})
/**
 * The component that is responsible for listing the Notes that are related to a certain child
 */
export class NotesListComponent implements OnInit {

  childId: string;
  records: Array<NoteModel> = [];
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

    this.entityMapperService.loadType<NoteModel>(NoteModel).then(notes => {
      this.records = notes.filter(note => note.isLinkedWithChild(this.childId));
    });
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const user = this.sessionService.getCurrentUser().name;
    const childId = this.childId;

    return () => {
      const newNote = new NoteModel(Date.now().toString());
      newNote.date = new Date();
      newNote.addChild(childId);
      newNote.author = user;

      return newNote;
    };
  }

}
