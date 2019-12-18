import {Component, OnDestroy, OnInit} from '@angular/core';
import {NoteModel} from '../../notes/note.model';
import {NoteDetailComponent} from '../../notes/note-detail/note-detail.component';
import {ColumnDescription, ColumnDescriptionInputType} from '../../ui-helper/entity-subrecord/column-description';
import {SessionService} from '../../session/session.service';
import {DatePipe} from '@angular/common';
import {ChildrenService} from '../children.service';
import {ActivatedRoute} from '@angular/router';
import {NotesService} from '../../notes/notes.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss']
})
/**
 * The component that is responsible for listing the Notes that are related to a certain child
 */
export class NotesListComponent implements OnInit, OnDestroy {

  childId: string;
  records: Array<NoteModel>;
  recordSubscription: Subscription;
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
              private notesService: NotesService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id');

      // sets the records and sorts them according to the date-value
      this.notesService.getNotesForChild(this.childId).subscribe(notes => {
          this.records = notes.sort((first, second) => {
            return (second.date ? second.date.valueOf() : 0) - (first.date ? first.date.valueOf() : 0);
          });
      });

      // in order to make something like this work, the {@link AppEntitySubrecord} would have to be altered
      this.recordSubscription = this.notesService.getUpdater().subscribe(newNotes => {
        newNotes.forEach(newModel => this.records.push(newModel));
      });

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

  ngOnDestroy(): void {
    this.recordSubscription.unsubscribe();
  }

}
